# Multi-Language Code Execution Support

## ✅ Supported Languages

Your Monaco Editor now supports code execution for:

| Language   | Extension | Primary Engine | Fallback | Status |
|------------|-----------|----------------|----------|--------|
| JavaScript | .js       | VM2 (Local)    | -        | ✅ Always works |
| Python     | .py       | Piston API     | Local Python | ✅ Dual-mode |
| Java       | .java     | Piston API     | Local JDK | ✅ Dual-mode |
| C          | .c        | Piston API     | Local GCC | ✅ Dual-mode |
| C++        | .cpp      | Piston API     | Local G++ | ✅ Dual-mode |

## 🔄 Dual-Mode Execution

The system intelligently handles code execution:

1. **Primary**: Tries Piston API (free cloud service)
2. **Fallback**: Uses local compilers if API fails
3. **Smart**: Automatically switches between modes

### Benefits
- ✅ Works even when Piston API is down
- ✅ No installation required for cloud mode
- ✅ Fast local execution as backup
- ✅ Seamless user experience

## 🚀 Quick Start

1. **Create a file** with the appropriate extension
2. **Write your code** in Monaco Editor
3. **Run it**: Click "▶️ Run" or press `Ctrl+Enter`
4. **See output** in the panel below

## 📝 Example Usage

### JavaScript
```javascript
console.log('Hello from JavaScript!');
const result = [1, 2, 3].map(x => x * 2);
console.log(result);
```

### Python
```python
print('Hello from Python!')
numbers = [1, 2, 3, 4, 5]
squares = [x**2 for x in numbers]
print(squares)
```

### Java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
```

### C
```c
#include <stdio.h>
int main() {
    printf("Hello from C!\n");
    return 0;
}
```

### C++
```cpp
#include <iostream>
using namespace std;
int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
```

## 🔧 How It Works

### JavaScript (Always Available)
- Runs in a sandboxed VM using `vm2`
- 5-second timeout
- No file system or network access
- Secure and fast

### Python, Java, C, C++ (Dual-Mode)
- **Primary**: Uses [Piston API](https://github.com/engineer-man/piston) (cloud)
- **Fallback**: Uses local compilers if API unavailable
- Automatic failover between modes
- Supports standard libraries

## 📦 Installation (Optional)

**For cloud-only mode:** No installation needed!

**For local fallback:** Install compilers on your system.
See `COMPILER_SETUP.md` for detailed instructions.

Quick check what's installed:
```bash
python --version
java --version
gcc --version
g++ --version
```

## 🎯 Features

✅ Syntax highlighting for all languages  
✅ Auto-completion and IntelliSense  
✅ Error messages with line numbers  
✅ Standard library support  
✅ Fast execution (< 2 seconds typically)  
✅ Secure sandboxed environment  
✅ Real-time collaboration still works  

## ⚠️ Limitations

- **Execution timeout**: ~5-10 seconds max
- **No file I/O**: Cannot read/write files
- **No network access**: Cannot make HTTP requests
- **Memory limits**: Limited RAM per execution
- **Java**: Main class must be named `Main`

## 🐛 Troubleshooting

### "Language not supported"
→ Check your file extension matches the language

### Compilation error (Java/C/C++)
→ Check syntax, includes, and class names

### No output
→ Use correct output function:
- JS: `console.log()`
- Python: `print()`
- Java: `System.out.println()`
- C: `printf()`
- C++: `cout <<`

### Timeout error
→ Optimize your code or reduce input size

## 📚 More Examples

See `MULTI_LANGUAGE_EXAMPLES.md` for comprehensive examples in all supported languages.

## 🔮 Future Enhancements

Potential additions:
- Go, Rust, Ruby, PHP
- Custom input/arguments
- File upload for testing
- Performance metrics
- Code sharing with execution results

---

**Powered by:**
- Monaco Editor (Microsoft)
- VM2 (JavaScript sandbox)
- Piston API (Multi-language execution)
