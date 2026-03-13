# Code Execution Troubleshooting Guide

## Common Issues & Solutions

### 1. "Piston API error: Unauthorized"

**Cause:** Piston API is rate-limited, down, or blocking requests

**Solutions:**
- ✅ System automatically tries local execution as fallback
- Install compilers locally (see `COMPILER_SETUP.md`)
- Try again in a few minutes (rate limit may reset)
- Check [Piston status](https://github.com/engineer-man/piston)

### 2. "python not installed or not in PATH"

**Cause:** Python not installed or not accessible

**Solutions:**
```bash
# Check if Python is installed
python --version

# Windows: Add to PATH
# 1. Search "Environment Variables" in Start Menu
# 2. Edit "Path" variable
# 3. Add Python installation directory
# 4. Restart terminal/IDE

# Install Python
# Download from: https://www.python.org/downloads/
# Check "Add Python to PATH" during installation
```

### 3. "gcc not installed or not in PATH"

**Cause:** GCC compiler not installed

**Solutions:**
```bash
# Check if GCC is installed
gcc --version

# Windows: Install MinGW-w64
# 1. Download from: https://www.mingw-w64.org/
# 2. Or use MSYS2: pacman -S mingw-w64-x86_64-gcc
# 3. Add to PATH
# 4. Restart terminal

# Verify installation
gcc --version
g++ --version
```

### 4. "javac not installed or not in PATH"

**Cause:** Java JDK not installed (JRE alone is not enough)

**Solutions:**
```bash
# Check if Java is installed
java --version
javac --version  # Must have javac (compiler)

# Install JDK (not just JRE)
# Download from: https://adoptium.net/
# Or: https://www.oracle.com/java/technologies/downloads/

# Set JAVA_HOME
# Windows: Set environment variable JAVA_HOME to JDK path
# Example: C:\Program Files\Java\jdk-17
```

### 5. "Execution timeout (5 seconds)"

**Cause:** Code takes too long to execute

**Solutions:**
- Optimize your algorithm
- Reduce input size
- Avoid infinite loops
- Check for recursive functions without base case

**Example:**
```python
# Bad: Infinite loop
while True:
    print("Hello")

# Good: Limited iterations
for i in range(10):
    print("Hello")
```

### 6. No Output Displayed

**Cause:** Not using correct output function

**Solutions:**

```javascript
// JavaScript
console.log('Hello');  // ✅ Correct

// Python
print('Hello')  // ✅ Correct

// Java
System.out.println("Hello");  // ✅ Correct

// C
printf("Hello\n");  // ✅ Correct

// C++
cout << "Hello" << endl;  // ✅ Correct
```

### 7. Compilation Errors (Java, C, C++)

**Common Issues:**

**Java:**
```java
// ❌ Wrong: Class name must be "Main"
public class MyClass {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}

// ✅ Correct: Must be named "Main"
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
```

**C/C++:**
```c
// ❌ Wrong: Missing includes
int main() {
    printf("Hello\n");
    return 0;
}

// ✅ Correct: Include headers
#include <stdio.h>
int main() {
    printf("Hello\n");
    return 0;
}
```

### 8. "Both execution services failed"

**Cause:** Both Piston API and local execution failed

**Solutions:**
1. Check error messages for specific issues
2. Verify compilers are installed: `python --version`, `gcc --version`, etc.
3. Check code syntax
4. Try JavaScript first to verify system is working
5. Restart backend server

### 9. Backend Not Responding

**Symptoms:** Run button does nothing, no output

**Solutions:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Restart backend
cd backend
npm start

# Check backend logs for errors
# Look for error messages in terminal
```

### 10. Frontend Not Connecting

**Symptoms:** Can't see Run button, Monaco Editor not loading

**Solutions:**
```bash
# Restart frontend
cd frontend
npm run dev

# Clear browser cache
# Ctrl+Shift+R (hard refresh)

# Check browser console for errors
# F12 -> Console tab
```

## Testing Checklist

Use this to verify everything works:

```bash
# 1. Check backend is running
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. Check compilers (optional, for local fallback)
python --version
java --version
javac --version
gcc --version
g++ --version

# 3. Test JavaScript (should always work)
# Create test.js with: console.log('JS works!');
# Click Run

# 4. Test Python (tries Piston, falls back to local)
# Create test.py with: print('Python works!')
# Click Run

# 5. Check browser console for errors
# F12 -> Console tab
# Look for red error messages
```

## Getting Help

If issues persist:

1. **Check backend logs** - Look for error messages in terminal
2. **Check browser console** - F12 -> Console tab
3. **Verify installations** - Run version commands above
4. **Try simple code first** - Use examples from `TEST_ALL_LANGUAGES.md`
5. **Restart everything** - Backend, frontend, browser

## System Requirements

**Minimum:**
- Node.js 14+
- Modern browser (Chrome, Firefox, Edge)
- Internet connection (for Piston API)

**Recommended:**
- Node.js 18+
- Python 3.10+ (for local fallback)
- Java JDK 11+ (for local fallback)
- GCC/G++ (for local fallback)

## Performance Tips

- **JavaScript**: Fastest (runs locally)
- **Piston API**: Usually 1-3 seconds
- **Local execution**: Fast but requires installation
- **First run**: May be slower (cold start)
- **Subsequent runs**: Faster (warm cache)

---

Still having issues? Check:
- `COMPILER_SETUP.md` for installation help
- `LANGUAGE_SUPPORT.md` for feature overview
- `TEST_ALL_LANGUAGES.md` for test examples
