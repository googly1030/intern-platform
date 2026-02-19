"""
Code Analyzer Service
Analyzes code structure, patterns, and best practices
Includes complexity analysis, duplication detection, and documentation scoring
"""

import os
import re
import logging
from typing import Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


class CodeAnalyzer:
    """Service for analyzing code structure and patterns"""

    # Expected folder structure
    EXPECTED_FOLDERS = ["assets", "css", "js", "php"]
    EXPECTED_HTML_FILES = ["index.html", "login.html", "profile.html", "register.html"]
    EXPECTED_JS_FILES = ["login.js", "profile.js", "register.js"]
    EXPECTED_PHP_FILES = ["login.php", "profile.php", "register.php"]

    # Bootstrap classes to check
    BOOTSTRAP_CLASSES = [
        "container",
        "container-fluid",
        "row",
        "col-",
        "form-group",
        "form-control",
        "btn",
        "btn-primary",
        "navbar",
    ]

    def __init__(self, repo_path: str):
        """
        Initialize CodeAnalyzer.

        Args:
            repo_path: Path to the cloned repository
        """
        self.repo_path = repo_path
        self.analysis_result = {
            "folderStructure": {},
            "fileSeparation": {},
            "jqueryAjax": {},
            "bootstrap": {},
            "preparedStatements": {},
            "databases": {},
            "localStorage": {},
            "security": {},
            "codeComplexity": {},
            "codeDuplication": {},
            "documentation": {},
        }

    def analyze_all(self) -> dict:
        """
        Run all analysis checks.

        Returns:
            dict with complete analysis results
        """
        logger.info(f"Starting code analysis for {self.repo_path}")

        self.analyze_folder_structure()
        self.analyze_file_separation()
        self.analyze_jquery_ajax()
        self.analyze_bootstrap()
        self.analyze_prepared_statements()
        self.analyze_databases()
        self.analyze_localStorage()
        self.analyze_security()
        self.analyze_code_complexity()
        self.analyze_code_duplication()
        self.analyze_documentation()

        logger.info("Code analysis completed")
        return self.analysis_result

    def analyze_folder_structure(self) -> dict:
        """Analyze if the folder structure matches requirements"""
        result = {
            "score": 0,
            "existing_folders": [],
            "missing_folders": [],
            "existing_files": [],
            "missing_files": [],
        }

        # Check folders
        for folder in self.EXPECTED_FOLDERS:
            folder_path = os.path.join(self.repo_path, folder)
            if os.path.isdir(folder_path):
                result["existing_folders"].append(folder)
            else:
                result["missing_folders"].append(folder)

        # Check HTML files
        for file in self.EXPECTED_HTML_FILES:
            file_path = os.path.join(self.repo_path, file)
            if os.path.isfile(file_path):
                result["existing_files"].append(file)
            else:
                result["missing_files"].append(file)

        # Check JS files
        for file in self.EXPECTED_JS_FILES:
            file_path = os.path.join(self.repo_path, "js", file)
            if os.path.isfile(file_path):
                result["existing_files"].append(f"js/{file}")
            else:
                result["missing_files"].append(f"js/{file}")

        # Check PHP files
        for file in self.EXPECTED_PHP_FILES:
            file_path = os.path.join(self.repo_path, "php", file)
            if os.path.isfile(file_path):
                result["existing_files"].append(f"php/{file}")
            else:
                result["missing_files"].append(f"php/{file}")

        # Calculate score
        total_expected = len(self.EXPECTED_FOLDERS) + len(self.EXPECTED_HTML_FILES) + len(self.EXPECTED_JS_FILES) + len(self.EXPECTED_PHP_FILES)
        total_found = len(result["existing_folders"]) + len(result["existing_files"])
        result["score"] = int((total_found / total_expected) * 10) if total_expected > 0 else 0

        self.analysis_result["folderStructure"] = result
        return result

    def analyze_file_separation(self) -> dict:
        """Check if HTML, CSS, JS, and PHP are in separate files"""
        result = {
            "score": 10,
            "issues": [],
        }

        html_files = self._get_files_by_extension(".html")

        for html_file in html_files:
            content = self._read_file(html_file)

            # Check for inline styles
            style_matches = re.findall(r"<style[^>]*>.*?</style>", content, re.DOTALL)
            if style_matches:
                result["issues"].append({
                    "file": html_file,
                    "issue": "inline_css",
                    "count": len(style_matches),
                })
                result["score"] = min(result["score"], 7)

            # Check for inline scripts
            script_matches = re.findall(r"<script[^>]*>(?!.*src\s*=)(.*?)</script>", content, re.DOTALL)
            inline_scripts = [s for s in script_matches if s.strip()]
            if inline_scripts:
                result["issues"].append({
                    "file": html_file,
                    "issue": "inline_js",
                    "count": len(inline_scripts),
                })
                result["score"] = min(result["score"], 7)

            # Check for PHP in HTML
            php_matches = re.findall(r"<\?php.*?\?>", content, re.DOTALL)
            if php_matches:
                result["issues"].append({
                    "file": html_file,
                    "issue": "php_in_html",
                    "count": len(php_matches),
                })
                result["score"] = min(result["score"], 4)

        self.analysis_result["fileSeparation"] = result
        return result

    def analyze_jquery_ajax(self) -> dict:
        """Check if jQuery AJAX is used instead of form submission"""
        result = {
            "score": 10,
            "ajax_calls": 0,
            "form_submissions": 0,
            "issues": [],
        }

        js_files = self._get_files_by_extension(".js")
        html_files = self._get_files_by_extension(".html")

        all_content = ""
        for file in js_files + html_files:
            all_content += self._read_file(file) + "\n"

        # Check for jQuery AJAX calls
        ajax_patterns = [
            r"\$\s*\.\s*ajax\s*\(",
            r"\$\s*\.\s*post\s*\(",
            r"\$\s*\.\s*get\s*\(",
            r"\$\s*\(\s*[^)]+\s*\)\s*\.\s*load\s*\(",
        ]
        for pattern in ajax_patterns:
            matches = re.findall(pattern, all_content)
            result["ajax_calls"] += len(matches)

        # Check for form submissions
        form_patterns = [
            r'<form[^>]*action\s*=\s*["\'][^"\']+["\'][^>]*>',
            r'<form[^>]*method\s*=\s*["\'](?:post|get)["\'][^>]*>',
        ]
        for pattern in form_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            result["form_submissions"] += len(matches)

        # Check for submit buttons without AJAX
        submit_patterns = [
            r'<input[^>]*type\s*=\s*["\']submit["\'][^>]*>',
            r'<button[^>]*type\s*=\s*["\']submit["\'][^>]*>',
        ]
        submit_buttons = 0
        for pattern in submit_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            submit_buttons += len(matches)

        # Scoring logic
        if result["form_submissions"] > 0 and result["ajax_calls"] == 0:
            result["score"] = 0
            result["issues"].append("FORM_SUBMISSION_USED")
        elif result["form_submissions"] > 0:
            result["score"] = 4
            result["issues"].append("MIXED_AJAX_FORM")
        elif result["ajax_calls"] == 0:
            result["score"] = 5
            result["issues"].append("NO_AJAX_DETECTED")

        self.analysis_result["jqueryAjax"] = result
        return result

    def analyze_bootstrap(self) -> dict:
        """Check if Bootstrap is used for styling"""
        result = {
            "score": 0,
            "bootstrap_linked": False,
            "bootstrap_classes_found": [],
            "issues": [],
        }

        html_files = self._get_files_by_extension(".html")
        all_content = ""
        for file in html_files:
            all_content += self._read_file(file) + "\n"

        # Check for Bootstrap CDN/link
        bootstrap_link_patterns = [
            r'bootstrap\.min\.css',
            r'bootstrap\.css',
            r'cdn.*bootstrap',
        ]
        for pattern in bootstrap_link_patterns:
            if re.search(pattern, all_content, re.IGNORECASE):
                result["bootstrap_linked"] = True
                break

        # Check for Bootstrap classes
        for cls in self.BOOTSTRAP_CLASSES:
            pattern = rf'class\s*=\s*["\'][^"\']*{cls}[^"\']*["\']'
            if re.search(pattern, all_content):
                result["bootstrap_classes_found"].append(cls)

        # Scoring logic
        if result["bootstrap_linked"] and len(result["bootstrap_classes_found"]) >= 3:
            result["score"] = 10
        elif result["bootstrap_linked"] and len(result["bootstrap_classes_found"]) > 0:
            result["score"] = 7
        elif len(result["bootstrap_classes_found"]) > 0:
            result["score"] = 4
        else:
            result["score"] = 0
            result["issues"].append("NO_BOOTSTRAP")

        self.analysis_result["bootstrap"] = result
        return result

    def analyze_prepared_statements(self) -> dict:
        """Check if prepared statements are used for SQL queries"""
        result = {
            "score": 10,
            "prepared_statements": 0,
            "raw_sql_queries": 0,
            "issues": [],
        }

        php_files = self._get_files_by_extension(".php")
        all_content = ""
        for file in php_files:
            all_content += self._read_file(file) + "\n"

        # Check for prepared statements (both OOP and procedural styles)
        prepared_patterns = [
            # Object-oriented style
            r'->prepare\s*\(',
            r'->bind_param\s*\(',
            r'->bindParam\s*\(',
            # Procedural style (mysqli)
            r'mysqli_stmt_prepare\s*\(',
            r'mysqli_prepare\s*\(',
            r'mysqli_stmt_bind_param\s*\(',
            r'mysqli_bind_param\s*\(',
            # PDO named parameters
            r':\w+\s*\)',
        ]
        for pattern in prepared_patterns:
            matches = re.findall(pattern, all_content)
            result["prepared_statements"] += len(matches)

        # Check for raw SQL with variable interpolation
        raw_sql_patterns = [
            r'\$_(GET|POST|REQUEST)\s*\[[\'"]?\w+[\'"]?\s*\]',  # Direct superglobal in SQL
            r'\$[a-zA-Z_]\w*\s*\.\s*["\'].*?(?:SELECT|INSERT|UPDATE|DELETE)',  # Concatenation
            r'["\'].*?(?:SELECT|INSERT|UPDATE|DELETE).*?\$[a-zA-Z_]\w*',  # Variable in string
        ]
        for pattern in raw_sql_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            if matches:
                result["raw_sql_queries"] += len(matches)

        # Scoring logic
        if result["raw_sql_queries"] > 0 and result["prepared_statements"] == 0:
            result["score"] = 0
            result["issues"].append("SQL_INJECTION_RISK")
        elif result["raw_sql_queries"] > 0:
            result["score"] = 5
            result["issues"].append("MIXED_SQL_PREPARED")
        elif result["prepared_statements"] == 0:
            result["score"] = 5  # No SQL found, neutral score

        self.analysis_result["preparedStatements"] = result
        return result

    def analyze_databases(self) -> dict:
        """Check which databases are used"""
        result = {
            "mysql": {"detected": False, "score": 0, "evidence": []},
            "mongodb": {"detected": False, "score": 0, "evidence": []},
            "redis": {"detected": False, "score": 0, "evidence": []},
        }

        php_files = self._get_files_by_extension(".php")
        all_content = ""
        for file in php_files:
            all_content += self._read_file(file) + "\n"

        # MySQL detection
        mysql_patterns = [
            (r'mysqli_connect\s*\(', 'mysqli_connect'),
            (r'new\s+mysqli\s*\(', 'new mysqli'),
            (r'new\s+PDO\s*\([^)]*mysql', 'PDO MySQL'),
            (r'\$conn\s*=\s*mysqli_connect', 'mysqli connection'),
        ]
        for pattern, name in mysql_patterns:
            if re.search(pattern, all_content):
                result["mysql"]["detected"] = True
                result["mysql"]["evidence"].append(name)
        if result["mysql"]["detected"]:
            result["mysql"]["score"] = 8

        # MongoDB detection
        mongodb_patterns = [
            (r'new\s+MongoClient\s*\(', 'MongoClient'),
            (r'new\s+MongoDB\\Client\s*\(', 'MongoDB Client'),
            (r'MongoDB\\Driver', 'MongoDB Driver'),
            (r'\$mongo\s*=', 'mongo variable'),
        ]
        for pattern, name in mongodb_patterns:
            if re.search(pattern, all_content):
                result["mongodb"]["detected"] = True
                result["mongodb"]["evidence"].append(name)
        if result["mongodb"]["detected"]:
            result["mongodb"]["score"] = 8

        # Redis detection
        redis_patterns = [
            (r'new\s+Redis\s*\(', 'Redis class'),
            (r'Predis\\Client', 'Predis'),
            (r'redis\.connect\s*\(', 'redis connect'),
            (r'\$redis\s*=\s*new\s+Redis', 'redis variable'),
        ]
        for pattern, name in redis_patterns:
            if re.search(pattern, all_content):
                result["redis"]["detected"] = True
                result["redis"]["evidence"].append(name)
        if result["redis"]["detected"]:
            result["redis"]["score"] = 5

        self.analysis_result["databases"] = result
        return result

    def analyze_localStorage(self) -> dict:
        """Check if localStorage is used for session management"""
        result = {
            "detected": False,
            "score": 0,
            "evidence": [],
        }

        js_files = self._get_files_by_extension(".js")
        all_content = ""
        for file in js_files:
            all_content += self._read_file(file) + "\n"

        # localStorage patterns
        patterns = [
            (r'localStorage\.setItem\s*\(', 'setItem'),
            (r'localStorage\.getItem\s*\(', 'getItem'),
            (r'localStorage\.removeItem\s*\(', 'removeItem'),
        ]
        for pattern, name in patterns:
            if re.search(pattern, all_content):
                result["detected"] = True
                result["evidence"].append(name)

        if result["detected"]:
            result["score"] = 4

        self.analysis_result["localStorage"] = result
        return result

    def analyze_security(self) -> dict:
        """Check for security best practices"""
        result = {
            "score": 5,
            "password_hashing": False,
            "input_sanitization": False,
            "issues": [],
        }

        php_files = self._get_files_by_extension(".php")
        all_content = ""
        for file in php_files:
            all_content += self._read_file(file) + "\n"

        # Check for password hashing
        if re.search(r'password_hash\s*\(|password_verify\s*\(|bcrypt|PASSWORD_DEFAULT', all_content):
            result["password_hashing"] = True
            result["score"] += 1

        # Check for input sanitization
        if re.search(r'htmlspecialchars|strip_tags|mysqli_real_escape|filter_input', all_content):
            result["input_sanitization"] = True
            result["score"] += 1

        # Cap score at 5
        result["score"] = min(result["score"], 5)

        self.analysis_result["security"] = result
        return result

    def _get_files_by_extension(self, extension: str) -> list:
        """Get all files with a specific extension"""
        files = []
        for root, _, filenames in os.walk(self.repo_path):
            for filename in filenames:
                if filename.endswith(extension):
                    files.append(os.path.join(root, filename))
        return files

    def _read_file(self, file_path: str) -> str:
        """Read file content safely"""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return ""

    def analyze_code_complexity(self) -> dict:
        """
        Analyze code complexity including:
        - Function length
        - Nesting depth
        - Cyclomatic complexity (simplified)
        - Number of parameters
        """
        result = {
            "score": 10,
            "avg_function_length": 0,
            "max_nesting_depth": 0,
            "total_functions": 0,
            "complex_functions": [],
            "issues": [],
        }

        all_functions = []
        max_depth = 0

        # Analyze PHP files
        php_files = self._get_files_by_extension(".php")
        for file_path in php_files:
            content = self._read_file(file_path)
            file_functions = self._analyze_php_complexity(content, file_path)
            all_functions.extend(file_functions)
            depth = self._calculate_nesting_depth(content)
            max_depth = max(max_depth, depth)

        # Analyze JS files
        js_files = self._get_files_by_extension(".js")
        for file_path in js_files:
            content = self._read_file(file_path)
            file_functions = self._analyze_js_complexity(content, file_path)
            all_functions.extend(file_functions)
            depth = self._calculate_nesting_depth(content)
            max_depth = max(max_depth, depth)

        result["max_nesting_depth"] = max_depth
        result["total_functions"] = len(all_functions)

        if all_functions:
            result["avg_function_length"] = sum(f["lines"] for f in all_functions) / len(all_functions)

            # Identify complex functions (long or deeply nested)
            for func in all_functions:
                if func["lines"] > 50 or func.get("nesting", 0) > 4:
                    result["complex_functions"].append(func)

        # Scoring logic
        if result["avg_function_length"] > 100:
            result["score"] -= 3
            result["issues"].append("very_long_functions")
        elif result["avg_function_length"] > 50:
            result["score"] -= 1
            result["issues"].append("long_functions")

        if max_depth > 5:
            result["score"] -= 3
            result["issues"].append("deep_nesting")
        elif max_depth > 3:
            result["score"] -= 1
            result["issues"].append("moderate_nesting")

        if len(result["complex_functions"]) > 5:
            result["score"] -= 2
            result["issues"].append("many_complex_functions")

        result["score"] = max(0, result["score"])
        self.analysis_result["codeComplexity"] = result
        return result

    def _analyze_php_complexity(self, content: str, file_path: str) -> list:
        """Analyze PHP function complexity"""
        functions = []

        # Find function definitions
        pattern = r'function\s+(\w+)\s*\([^)]*\)\s*\{'
        matches = list(re.finditer(pattern, content))

        for match in matches:
            func_name = match.group(1)
            start_pos = match.start()

            # Find function end (simplified - count braces)
            brace_count = 0
            end_pos = start_pos
            in_function = False

            for i, char in enumerate(content[start_pos:], start_pos):
                if char == '{':
                    brace_count += 1
                    in_function = True
                elif char == '}':
                    brace_count -= 1
                    if in_function and brace_count == 0:
                        end_pos = i
                        break

            # Count lines in function
            func_content = content[start_pos:end_pos + 1]
            lines = len(func_content.split('\n'))

            # Count nesting depth
            nesting = self._calculate_nesting_depth(func_content)

            # Count parameters
            param_match = re.search(r'function\s+\w+\s*\(([^)]*)\)', content[start_pos:])
            param_count = 0
            if param_match:
                params = param_match.group(1)
                param_count = len([p for p in params.split(',') if p.strip() and p.strip() != ''])

            functions.append({
                "name": func_name,
                "file": os.path.basename(file_path),
                "lines": lines,
                "nesting": nesting,
                "parameters": param_count,
            })

        return functions

    def _analyze_js_complexity(self, content: str, file_path: str) -> list:
        """Analyze JavaScript function complexity"""
        functions = []

        # Find function definitions (including arrow functions and methods)
        patterns = [
            r'function\s+(\w+)\s*\([^)]*\)\s*\{',
            r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>',
            r'(\w+)\s*:\s*(?:async\s*)?function\s*\([^)]*\)',
        ]

        for pattern in patterns:
            matches = list(re.finditer(pattern, content))

            for match in matches:
                func_name = match.group(1)
                start_pos = match.start()

                # Find function end
                brace_count = 0
                end_pos = start_pos
                in_function = False

                for i, char in enumerate(content[start_pos:], start_pos):
                    if char == '{':
                        brace_count += 1
                        in_function = True
                    elif char == '}':
                        brace_count -= 1
                        if in_function and brace_count == 0:
                            end_pos = i
                            break

                # Count lines
                func_content = content[start_pos:end_pos + 1]
                lines = len(func_content.split('\n'))

                # Count nesting depth
                nesting = self._calculate_nesting_depth(func_content)

                functions.append({
                    "name": func_name,
                    "file": os.path.basename(file_path),
                    "lines": lines,
                    "nesting": nesting,
                })

        return functions

    def _calculate_nesting_depth(self, content: str) -> int:
        """Calculate maximum nesting depth in code"""
        max_depth = 0
        current_depth = 0

        for char in content:
            if char == '{':
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif char == '}':
                current_depth = max(0, current_depth - 1)

        return max_depth

    def analyze_code_duplication(self) -> dict:
        """
        Detect code duplication using a simplified approach.
        Uses line-based hashing to find similar blocks.
        """
        result = {
            "score": 10,
            "duplicate_blocks": [],
            "duplication_percentage": 0,
            "issues": [],
        }

        # Collect all code normalized
        code_lines_by_file = {}
        all_extensions = [".php", ".js", ".css"]

        for ext in all_extensions:
            for file_path in self._get_files_by_extension(ext):
                content = self._read_file(file_path)
                # Normalize: remove whitespace, comments
                normalized = self._normalize_code(content, ext)
                code_lines_by_file[file_path] = normalized

        # Find duplicate blocks (minimum 5 lines)
        line_hashes = defaultdict(list)
        min_block_size = 5

        for file_path, lines in code_lines_by_file.items():
            for i in range(len(lines) - min_block_size + 1):
                block = '\n'.join(lines[i:i + min_block_size])
                block_hash = hash(block)
                line_hashes[block_hash].append({
                    "file": os.path.basename(file_path),
                    "line": i + 1,
                })

        # Count duplications
        duplicate_count = 0
        for block_hash, locations in line_hashes.items():
            if len(locations) > 1:
                duplicate_count += len(locations) - 1  # Count copies, not originals
                if len(result["duplicate_blocks"]) < 10:  # Limit stored blocks
                    result["duplicate_blocks"].append({
                        "locations": locations,
                        "count": len(locations),
                    })

        # Calculate duplication percentage
        total_lines = sum(len(lines) for lines in code_lines_by_file.values())
        if total_lines > 0:
            result["duplication_percentage"] = round((duplicate_count * min_block_size) / total_lines * 100, 1)

        # Scoring
        if result["duplication_percentage"] > 30:
            result["score"] = 2
            result["issues"].append("high_duplication")
        elif result["duplication_percentage"] > 15:
            result["score"] = 5
            result["issues"].append("moderate_duplication")
        elif result["duplication_percentage"] > 5:
            result["score"] = 8
            result["issues"].append("some_duplication")

        self.analysis_result["codeDuplication"] = result
        return result

    def _normalize_code(self, content: str, extension: str) -> list:
        """Normalize code for comparison"""
        lines = []

        # Remove comments based on file type
        if extension == ".php":
            # Remove PHP comments
            content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
            content = re.sub(r'#.*$', '', content, flags=re.MULTILINE)
        elif extension == ".js":
            # Remove JS comments
            content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        elif extension == ".css":
            # Remove CSS comments
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

        # Split into lines and normalize
        for line in content.split('\n'):
            # Strip whitespace and skip empty lines
            normalized = line.strip()
            if normalized:
                lines.append(normalized)

        return lines

    def analyze_documentation(self) -> dict:
        """
        Analyze documentation quality including:
        - README presence and quality
        - Code comments
        - Docblocks
        """
        result = {
            "score": 0,
            "readme": {"exists": False, "quality": 0, "sections": []},
            "comments": {"ratio": 0, "total_lines": 0, "comment_lines": 0},
            "docblocks": 0,
            "issues": [],
        }

        # Check for README
        readme_path = None
        for name in ["README.md", "readme.md", "README.txt", "readme.txt", "README"]:
            path = os.path.join(self.repo_path, name)
            if os.path.isfile(path):
                readme_path = path
                break

        if readme_path:
            result["readme"]["exists"] = True
            readme_content = self._read_file(readme_path)
            readme_analysis = self._analyze_readme(readme_content)
            result["readme"]["quality"] = readme_analysis["quality"]
            result["readme"]["sections"] = readme_analysis["sections"]
        else:
            result["issues"].append("no_readme")

        # Count comments in code files
        total_code_lines = 0
        total_comment_lines = 0
        total_docblocks = 0

        for ext in [".php", ".js"]:
            for file_path in self._get_files_by_extension(ext):
                content = self._read_file(file_path)
                lines = content.split('\n')
                total_code_lines += len(lines)

                # Count single-line comments
                if ext == ".php":
                    comments = len(re.findall(r'(?://|#).*$', content, re.MULTILINE))
                    # Count multi-line comments
                    comments += len(re.findall(r'/\*.*?\*/', content, re.DOTALL))
                    # Count docblocks
                    total_docblocks += len(re.findall(r'/\*\*', content))
                else:  # JS
                    comments = len(re.findall(r'//.*$', content, re.MULTILINE))
                    comments += len(re.findall(r'/\*.*?\*/', content, re.DOTALL))
                    total_docblocks += len(re.findall(r'/\*\*', content))

                total_comment_lines += comments

        result["comments"]["total_lines"] = total_code_lines
        result["comments"]["comment_lines"] = total_comment_lines
        result["docblocks"] = total_docblocks

        if total_code_lines > 0:
            result["comments"]["ratio"] = round(total_comment_lines / total_code_lines * 100, 1)

        # Calculate overall documentation score
        score = 0

        # README score (0-5 points)
        if result["readme"]["exists"]:
            score += min(result["readme"]["quality"], 5)

        # Comment ratio score (0-3 points)
        if result["comments"]["ratio"] >= 10:
            score += 3
        elif result["comments"]["ratio"] >= 5:
            score += 2
        elif result["comments"]["ratio"] >= 2:
            score += 1
        else:
            result["issues"].append("few_comments")

        # Docblocks score (0-2 points)
        if total_docblocks >= 5:
            score += 2
        elif total_docblocks >= 1:
            score += 1

        result["score"] = min(score, 10)
        self.analysis_result["documentation"] = result
        return result

    def _analyze_readme(self, content: str) -> dict:
        """Analyze README quality"""
        result = {
            "quality": 0,
            "sections": [],
        }

        # Check for common README sections
        section_patterns = {
            "title": r'^#\s+.+$',
            "description": r'(?i)(description|about|overview)',
            "installation": r'(?i)(installation|install|setup)',
            "usage": r'(?i)(usage|how to|example)',
            "features": r'(?i)(features|functionality)',
            "requirements": r'(?i)(requirements|prerequisites)',
            "license": r'(?i)(license)',
            "author": r'(?i)(author|contact)',
        }

        for section, pattern in section_patterns.items():
            if re.search(pattern, content, re.MULTILINE):
                result["sections"].append(section)

        # Quality scoring
        # Title
        if re.search(r'^#\s+.+$', content, re.MULTILINE):
            result["quality"] += 1

        # Description
        if len(content) > 100:
            result["quality"] += 1

        # Installation instructions
        if "installation" in result["sections"] or "install" in result["sections"]:
            result["quality"] += 1

        # Usage/Examples
        if "usage" in result["sections"] or "example" in result["sections"]:
            result["quality"] += 1

        # Code blocks
        if re.search(r'```', content):
            result["quality"] += 1

        return result
