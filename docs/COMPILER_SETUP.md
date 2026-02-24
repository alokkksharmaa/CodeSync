# Compiler Setup Guide

The code execution system now has **dual-mode support**:
1. **Piston API** (cloud-based, no installation needed)
2. **Local execution** (fallback, requires compilers installed)

## How It Works

When you run code:
1. First tries **Piston API** (free cloud service)
2. If Piston fails, falls back to **local compilers**
3. Shows helpful error if both fail

## Installing Local Compilers (Optional)

If Piston API is unavailable, install these compilers for local execution:

### Python

**Windows:**
1. Download from [python.org](https://www.python.org/downloads/)
2. Run installer, check "Add Python to PATH"
3. Verify: `python --version`

**Already installed?** Check with:
```bash
python --version
```

### Java (JDK)

**Windows:**
1. Download [OpenJDK](https://adoptium.net/) or [Oracle JDK](https://www.oracle.com/java/technologies/downloads/)
2. Install and add to PATH
3. Verify: `java --version` and `javac --version`

### C/C++ (GCC/G++)

**Windows:**
1. Install [MinGW-w64](https://www.mingw-w64.org/downloads/)
2. Or install via [MSYS2](https://www.msys2.org/):
   ```bash
   pacman -S mingw-w64-x86_64-gcc
   ```
3. Add to PATH
4. Verify: `gcc --version` and `g++ --version`

**Alternative:** Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

## Quick Check

Run these commands to see what's installed:

```bash
python --version
java --version
javac --version
gcc --version
g++ --version
```

## Current Status

✅ **JavaScript** - Always works (VM2, no installation needed)  
🌐 **Python, Java, C, C++** - Try Piston API first  
💻 **Fallback** - Use local compilers if Piston fails  

## Troubleshooting

### "Piston API error: Unauthorized"
→ Piston API might be rate-limited or down
→ System will automatically try local execution
→ Install compilers for local fallback

### "python not installed or not in PATH"
→ Install Python and add to PATH
→ Restart your terminal/IDE after installation

### "gcc not installed or not in PATH"
→ Install MinGW-w64 or MSYS2
→ Add to system PATH
→ Restart terminal

### "javac not installed or not in PATH"
→ Install JDK (not just JRE)
→ Set JAVA_HOME environment variable
→ Add to PATH

## Recommended Setup

For best experience, install:
1. **Python 3.10+** (most common)
2. **Java JDK 11+** (if you use Java)
3. **GCC/G++** (if you use C/C++)

This gives you:
- ✅ Fast cloud execution via Piston
- ✅ Reliable local fallback
- ✅ Works offline

## No Installation Needed?

If you don't want to install compilers:
- JavaScript will always work
- Other languages depend on Piston API availability
- Consider using during off-peak hours for better API reliability

---

**Note:** The system is designed to work with Piston API by default. Local execution is a backup option for when the API is unavailable.
