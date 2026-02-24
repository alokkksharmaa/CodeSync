# Multi-Language Code Execution Examples

Test these examples in your Monaco Editor by creating files with the appropriate extensions.

## JavaScript (.js)
```javascript
// Hello World
console.log('Hello from JavaScript!');

// Variables and operations
const name = 'CodeSync';
const version = 2.0;
console.log(`Welcome to ${name} v${version}`);

// Functions
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));

// Arrays and objects
const languages = ['JavaScript', 'Python', 'Java', 'C++'];
console.log('Supported languages:', languages);

const user = {
  name: 'Developer',
  role: 'editor',
  skills: languages
};
console.log('User:', user);
```

## Python (.py)
```python
# Hello World
print('Hello from Python!')

# Variables and operations
name = 'CodeSync'
version = 2.0
print(f'Welcome to {name} v{version}')

# Functions
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print('Fibonacci(10):', fibonacci(10))

# Lists and dictionaries
languages = ['JavaScript', 'Python', 'Java', 'C++']
print('Supported languages:', languages)

user = {
    'name': 'Developer',
    'role': 'editor',
    'skills': languages
}
print('User:', user)

# List comprehension
squares = [x**2 for x in range(1, 11)]
print('Squares:', squares)
```

## Java (.java)
```java
public class Main {
    public static void main(String[] args) {
        // Hello World
        System.out.println("Hello from Java!");
        
        // Variables
        String name = "CodeSync";
        double version = 2.0;
        System.out.println("Welcome to " + name + " v" + version);
        
        // Functions
        System.out.println("Fibonacci(10): " + fibonacci(10));
        
        // Arrays
        String[] languages = {"JavaScript", "Python", "Java", "C++"};
        System.out.print("Supported languages: ");
        for (String lang : languages) {
            System.out.print(lang + " ");
        }
        System.out.println();
    }
    
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}
```

## C (.c)
```c
#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    // Hello World
    printf("Hello from C!\n");
    
    // Variables
    char name[] = "CodeSync";
    float version = 2.0;
    printf("Welcome to %s v%.1f\n", name, version);
    
    // Functions
    printf("Fibonacci(10): %d\n", fibonacci(10));
    
    // Arrays
    char *languages[] = {"JavaScript", "Python", "Java", "C++"};
    printf("Supported languages: ");
    for (int i = 0; i < 4; i++) {
        printf("%s ", languages[i]);
    }
    printf("\n");
    
    return 0;
}
```

## C++ (.cpp)
```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    // Hello World
    cout << "Hello from C++!" << endl;
    
    // Variables
    string name = "CodeSync";
    double version = 2.0;
    cout << "Welcome to " << name << " v" << version << endl;
    
    // Functions
    cout << "Fibonacci(10): " << fibonacci(10) << endl;
    
    // Vectors
    vector<string> languages = {"JavaScript", "Python", "Java", "C++"};
    cout << "Supported languages: ";
    for (const auto& lang : languages) {
        cout << lang << " ";
    }
    cout << endl;
    
    return 0;
}
```

## Testing Instructions

1. **Create a file** with the appropriate extension:
   - `test.js` for JavaScript
   - `test.py` for Python
   - `Main.java` for Java
   - `test.c` for C
   - `test.cpp` for C++

2. **Copy the example code** into the Monaco Editor

3. **Run the code**:
   - Click the "▶️ Run" button, or
   - Press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

4. **View output** in the execution panel at the bottom

## Language-Specific Notes

### JavaScript
- Runs locally in a sandboxed VM (vm2)
- 5-second timeout
- Supports console.log, console.error, console.warn

### Python
- Runs on Piston API (Python 3.10.0)
- Supports standard library
- Use `print()` for output

### Java
- Runs on Piston API (Java 15.0.2)
- Main class must be named `Main`
- Use `System.out.println()` for output

### C
- Runs on Piston API (GCC 10.2.0)
- Supports standard C library
- Use `printf()` for output

### C++
- Runs on Piston API (G++ 10.2.0)
- Supports C++17 features
- Use `cout` for output

## Troubleshooting

### "Language not supported"
- Check file extension matches language
- Supported: .js, .py, .java, .c, .cpp

### Compilation errors (Java, C, C++)
- Check syntax carefully
- Java: Main class must be named `Main`
- C/C++: Include necessary headers

### Timeout errors
- Code takes too long to execute
- Optimize algorithms or reduce input size
- JavaScript has 5-second local timeout
- Piston API has its own timeout limits

### No output
- Make sure you're using the correct output function:
  - JavaScript: `console.log()`
  - Python: `print()`
  - Java: `System.out.println()`
  - C: `printf()`
  - C++: `cout <<`

## Advanced Examples

### Python - File I/O Simulation
```python
# Working with data structures
data = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, data))
print("Squared:", squared)

# Dictionary operations
person = {'name': 'Alice', 'age': 30}
person['city'] = 'New York'
print("Person:", person)
```

### Java - Object-Oriented
```java
class Person {
    String name;
    int age;
    
    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    void introduce() {
        System.out.println("Hi, I'm " + name + " and I'm " + age + " years old.");
    }
}

public class Main {
    public static void main(String[] args) {
        Person person = new Person("Alice", 30);
        person.introduce();
    }
}
```

### C++ - STL Usage
```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> numbers = {5, 2, 8, 1, 9};
    
    sort(numbers.begin(), numbers.end());
    
    cout << "Sorted: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    return 0;
}
```

Enjoy coding in multiple languages! 🚀
