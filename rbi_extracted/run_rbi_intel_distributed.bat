@echo off
setlocal enabledelayedexpansion
title RBI Regulatory Intelligence - Run (packaged build)

echo ============================================================
echo  RBI Regulatory Intelligence - Run (packaged build)
echo ============================================================
echo.
echo This runs the PRE-BUILT version shipped in this package - it does
echo NOT compile TypeScript (there is no source/tsconfig here on purpose;
echo npm pack ships only the compiled "dist" folder). If you need to
echo change the code, use the source checkout and run_rbi_intel.bat there
echo instead of this file.
echo.
echo This will, in order:
echo   1. Check Node.js and Python are installed
echo   2. Install runtime dependencies (npm + pip)
echo   3. Create/migrate the database
echo   4. Health-check the RBI website
echo   5. Full sync (last 60 days of notifications; full history on first run)
echo   6. Chunk / extract / scaffold (extract+scaffold need an AI key)
echo   7. Validate the database
echo   8. Launch the dashboard
echo.
echo Run this from the extracted package folder (where package.json lives).
echo.
pause

REM ---- Step 0: sanity check we're in the right folder -------------------
if not exist "package.json" (
    echo [ERROR] package.json not found in this folder.
    echo Copy this .bat file into the extracted package folder and run it from there.
    goto :fail
)
if not exist "dist" (
    echo [ERROR] "dist" folder not found. This doesn't look like a packaged
    echo build - if you're working from the source checkout, use
    echo run_rbi_intel.bat instead ^(it compiles TypeScript first^).
    goto :fail
)

REM ---- Step 1: check prerequisites ---------------------------------------
echo.
echo [1/8] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found on PATH. Install Node 22.5+ from https://nodejs.org and re-run.
    goto :fail
)
node --version

echo.
echo [1/8] Checking Python...
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python not found on PATH. Install Python 3.10+ from https://python.org and re-run.
    goto :fail
)
python --version

REM ---- Step 2: install dependencies --------------------------------------
echo.
echo [2/8] Installing Node runtime dependencies (npm install --omit=dev)...
call npm install --omit=dev
if errorlevel 1 (
    echo [ERROR] npm install failed. See the output above.
    goto :fail
)

echo.
echo [2/8] Installing Python dependencies...
if exist "python\requirements.txt" (
    python -m pip install -r python\requirements.txt
    if errorlevel 1 (
        echo [ERROR] pip install failed. See the output above.
        goto :fail
    )
) else (
    echo [WARN] python\requirements.txt not found - skipping.
)

REM ---- Step 3: init database (built) ---------------------------------------
echo.
echo [3/8] Creating/migrating the database (npm run init:built)...
call npm run init:built
if errorlevel 1 (
    echo [ERROR] Database init failed. See the output above.
    goto :fail
)

REM ---- Step 4: doctor / health check (built) --------------------------------
echo.
echo [4/8] Checking rbi.org.in is reachable (npm run doctor:built)...
call npm run doctor:built
if errorlevel 1 (
    echo.
    echo [WARN] Doctor reported a problem reaching/parsing rbi.org.in.
    echo        This is expected if rbi.org.in is blocked on this network.
    echo        You can still use "python rbi.py ingest" to load documents manually.
    echo.
    choice /C YN /M "Continue with sync anyway"
    if errorlevel 2 goto :skipsync
)

REM ---- Step 5: full sync (built) --------------------------------------------
echo.
echo [5/8] Syncing RBI documents (npm run sync:built)...
echo        First run: full history. Later runs: full-body sync, last 60 days
echo        of notifications; enrich + relations run automatically afterwards.
call npm run sync:built
if errorlevel 1 (
    echo [WARN] Sync reported errors - check the log above. Continuing anyway,
    echo        since a partial sync still leaves a usable database.
)

:skipsync

REM ---- Step 6: chunk / extract / scaffold ----------------------------------
echo.
echo [6/8] Chunking Master Directions into clauses...
python rbi.py chunk --all-master-directions
if errorlevel 1 echo [WARN] Chunking reported errors - see above.

echo.
if defined GEMINI_API_KEY goto :havekey
if defined ANTHROPIC_API_KEY goto :havekey
echo [SKIP] No AI key found (GEMINI_API_KEY / ANTHROPIC_API_KEY not set).
echo        Extract and Scaffold need one of these - skipping both.
echo        Set the key and re-run this script (or run "python rbi.py extract"
echo        and "python rbi.py scaffold" by hand later) to fill them in.
goto :afterllm

:havekey
echo [6/8] Extracting requirements (python rbi.py extract)...
python rbi.py extract
if errorlevel 1 echo [WARN] Extract reported errors - see above.

echo.
echo [6/8] Generating SEEDED compliance scaffold (python rbi.py scaffold)...
python rbi.py scaffold
if errorlevel 1 echo [WARN] Scaffold reported errors - see above.

:afterllm

REM ---- Step 7: validate -----------------------------------------------------
echo.
echo [7/8] Validating the database (python rbi.py validate)...
python rbi.py validate
if errorlevel 1 echo [WARN] Validation found issues - see above.

REM ---- Step 8: launch dashboard -----------------------------------------------
echo.
echo [8/8] Launching the dashboard...
echo        Opening in your browser. Press Ctrl+C in this window to stop it.
echo.
call npm run dashboard

goto :eof

:fail
echo.
echo Setup stopped early - see the [ERROR] line above for what to fix.
pause
exit /b 1

:eof
pause
