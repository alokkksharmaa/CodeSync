# Quick Reference Card

## 🎯 Supported Languages

| Language | Extension | Status |
|----------|-----------|--------|
| JavaScript | .js | ✅ Always works |
| Python | .py | ✅ Dual-mode |
| Java | .java | ✅ Dual-mode |
| C | .c | ✅ Dual-mode |
| C++ | .cpp | ✅ Dual-mode |

## ⌨️ Keyboard Shortcuts

- **Run Code**: `Ctrl+Enter` (or `Cmd+Enter` on Mac)
- **Save**: `Ctrl+S`
- **Find**: `Ctrl+F`
- **Replace**: `Ctrl+H`

## 🚀 Quick Start

1. Create file with extension (.js, .py, .java, .c, .cpp)
2. Write code
3. Press `Ctrl+Enter` or click "▶️ Run"
4. See output below

## 📝 Output Functions

```javascript
// JavaScript
console.log('Hello');

// Python
print('Hello')

// Java
System.out.println("Hello");

// C
printf("Hello\n");

// C++
cout << "Hello" << endl;
```

## 🔧 Installation (Optional)

For local fallback when Piston API is unavailable:

```bash
# Check what's installed
python --version
java --version
gcc --version
g++ --version
```

**Install:**
- Python: https://www.python.org/downloads/
- Java: https://adoptium.net/
- C/C++: https://www.mingw-w64.org/

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Piston API error | Install compilers locally |
| No output | Use correct output function |
| Timeout | Optimize code, avoid infinite loops |
| Compilation error | Check syntax, includes |

## 📚 Documentation

- **Overview**: `MULTI_LANGUAGE_SUMMARY.md`
- **Examples**: `MULTI_LANGUAGE_EXAMPLES.md`
- **Setup**: `COMPILER_SETUP.md`
- **Troubleshooting**: `EXECUTION_TROUBLESHOOTING.md`
- **Tests**: `TEST_ALL_LANGUAGES.md`

## ✅ Test Code

### JavaScript
```javascript
console.log('✅ JS works!');
```

### Python
```python
print('✅ Python works!')
```

### Java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("✅ Java works!");
    }
}
```

### C
```c
#include <stdio.h>
int main() {
    printf("✅ C works!\n");
    return 0;
}
```

### C++
```cpp
#include <iostream>
using namespace std;
int main() {
    cout << "✅ C++ works!" << endl;
    return 0;
}
```

## 🎉 That's It!

You're ready to code in 5 languages with Monaco Editor!
