@echo off
echo Compiling Java server...
javac PianoServer.java

if %ERRORLEVEL% EQU 0 (
    echo Starting piano server...
    echo Open your browser and go to http://localhost:8080
    java PianoServer
) else (
    echo Compilation failed!
    pause
)