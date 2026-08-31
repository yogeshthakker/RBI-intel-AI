@echo off
setlocal enabledelayedexpansion
title RBI Regulatory Intelligence - Build and Run

echo ============================================================
echo  RBI Regulatory Intelligence - Build and Run
echo ============================================================
echo.
echo This will, in order:
echo   1. Check Node.js and Python are installed
echo   2. Install dependencies (npm + pip)
echo   3. Compile the TypeScript layer
echo   4. Create/migrate the database
echo   5. Health-check the RBI website
echo   6. Full sync (last 60 days of notifications; full history on first run)
echo   7. Chunk / extract / scaffold (extract+scaffold need an AI key)
echo   8. Validate the database
echo   9. Launch the dashboard
echo.
echo Run this from the rbi-intel project folder (where package.json lives).
echo.
pause

REM ---- Step 0: sanity check we're in the right folder -------------------
if not exist "package.json" (
    echo [ERROR] package.json not found in this folder.
    echo Copy this .bat file into the rbi-intel project folder and run it from there.
    goto :fail
)

REM ---- Step 1: check prerequisites ---------------------------------------
echo.
echo [1/9] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found on PATH. Install Node 22.5+ from https://nodejs.org and re-run.
    goto :fail
)
node --version

echo.
echo [1/9] Checking Python...
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python not found on PATH. Install Python 3.10+ from https://python.org and re-run.
    goto :fail
)
python --version

REM ---- Step 2: install dependencies --------------------------------------
echo.
echo [2/9] Installing Node dependencies (npm install)...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed. See the output above.
    goto :fail
)

echo.
echo [2/9] Installing Python dependencies...
if exist "python\requirements.txt" (
    python -m pip install -r python\requirements.txt
    if errorlevel 1 (
        echo [ERROR] pip install failed. See the output above.
        goto :fail
    )
) else (
    echo [WARN] python\requirements.txt not found - skipping.
)

REM ---- Step 3: build ------------------------------------------------------
echo.
echo [3/9] Compiling TypeScript (npm run build)...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed. Fix the errors above and re-run.
    goto :fail
)

REM ---- Step 4: init database ----------------------------------------------
echo.
echo [4/9] Creating/migrating the database (npm run init)...
call npm run init
if errorlevel 1 (
    echo [ERROR] Database init failed. See the output above.
    goto :fail
)

REM ---- Step 5: doctor / health check --------------------------------------
echo.
echo [5/9] Checking rbi.org.in is reachable (npm run doctor)...
call npm run doctor
if errorlevel 1 (
    echo.
    echo [WARN] Doctor reported a problem reaching/parsing rbi.org.in.
    echo        This is expected if rbi.org.in is blocked on this network.
    echo        You can still use "python rbi.py ingest" to load documents manually.
    echo.
    choice /C YN /M "Continue with sync anyway"
    if errorlevel 2 goto :skipsync
)

REM ---- Step 6: full sync ---------------------------------------------------
echo.
echo [6/9] Syncing RBI documents (npm run sync)...
echo        First run: full history. Later runs: full-body sync, last 60 days
echo        of notifications; enrich + relations run automatically afterwards.
call npm run sync
if errorlevel 1 (
    echo [WARN] Sync reported errors - check the log above. Continuing anyway,
    echo        since a partial sync still leaves a usable database.
)

:skipsync

REM ---- Step 7: chunk / extract / scaffold ----------------------------------
echo.
echo [7/9] Chunking Master Directions into clauses...
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
echo [7/9] Extracting requirements (python rbi.py extract)...
python rbi.py extract
if errorlevel 1 echo [WARN] Extract reported errors - see above.

echo.
echo [7/9] Generating SEEDED compliance scaffold (python rbi.py scaffold)...
python rbi.py scaffold
if errorlevel 1 echo [WARN] Scaffold reported errors - see above.

:afterllm

REM ---- Step 8: validate -----------------------------------------------------
echo.
echo [8/9] Validating the database (python rbi.py validate)...
python rbi.py validate
if errorlevel 1 echo [WARN] Validation found issues - see above.

REM ---- Step 9: launch dashboard -----------------------------------------------
echo.
echo [9/9] Launching the dashboard...
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
