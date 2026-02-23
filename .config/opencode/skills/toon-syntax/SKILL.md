---
name: toon-syntax
description: Use TOON format correctly for token-efficient data encoding
license: MIT
compatibility: opencode
---

## What is TOON

TOON (Token-Oriented Object Notation) is a compact, human-readable encoding of the JSON data model designed for LLM prompts. It uses ~40% fewer tokens than JSON while maintaining accuracy and readability.

## Core Principles

- Uses indentation (2 spaces) instead of braces
- Minimizes quoting - only quote when necessary
- Explicit array lengths `[N]` for validation
- Tabular arrays declare fields once, stream rows
- Supports comma, tab, or pipe delimiters

## Syntax Rules

### Objects

Simple objects use `key: value` with one space after colon:

```
id: 123
name: Ada
active: true
```

Nested objects add one indentation level (2 spaces):

```
user:
  id: 123
  name: Ada
```

### Arrays

**Primitive arrays** (inline):
```
tags[3]: admin,ops,dev
```

**Tabular arrays** (uniform objects with primitive values):
```
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

**Mixed/non-uniform arrays** (list format with hyphens):
```
items[3]:
  - 1
  - a: 1
  - text
```

**Arrays of arrays**:
```
pairs[2]:
  - [2]: 1,2
  - [2]: 3,4
```

**Empty arrays**:
```
items[0]:
```

### Array Headers

Format: `key[N<delimiter?>]<{fields}>:`

- `N` = array length (required)
- `delimiter` = optional delimiter character (tab or pipe)
- `{fields}` = comma-separated field names for tabular arrays

Examples:
- `items[2]{id,name}:` - comma delimiter (default)
- `items[2	]{id	name}:` - tab delimiter
- `items[2|]{id|name}:` - pipe delimiter

### Quoting Rules

Strings MUST be quoted if they:
- Are empty (`""`)
- Have leading or trailing whitespace
- Equal `true`, `false`, or `null` (case-sensitive)
- Look like numbers (`"42"`, `"-3.14"`, `"1e-6"`, `"05"`)
- Contain special characters: `:`, `"`, `\`, `[`, `]`, `{`, `}`, newline, tab, carriage return
- Contain the active delimiter (comma by default)
- Equal `"-"` or start with `"-"` followed by any character

Otherwise, strings can be unquoted. Unicode and emoji are safe:
```
message: Hello 世界 👋
note: This has inner spaces
```

### Escape Sequences

Only five escape sequences are valid in quoted strings:

- `\\` - backslash
- `\"` - double quote
- `\n` - newline
- `\r` - carriage return
- `\t` - tab

All other escapes (e.g., `\x`, `\u`) are invalid.

### Type Conversions

- Numbers: canonical decimal form (no exponent, no trailing zeros)
- `NaN`, `Infinity`, `-Infinity`: convert to `null`
- `BigInt` (safe range): convert to number
- `BigInt` (out of range): quoted decimal string
- `Date`: ISO string in quotes
- `undefined`, `function`, `symbol`: convert to `null`

## Key Folding (Optional)

Collapse chains of single-key objects into dotted paths:

Standard:
```
data:
  metadata:
    items[2]: a,b
```

With key folding:
```
data.metadata.items[2]: a,b
```

Use `keyFolding: 'safe'` when encoding. Segments must be valid identifiers (letters, digits, underscores only).

## Delimiter Choices

- **Comma** (default): best for general use
- **Tab** (`\t`): often tokenizes more efficiently, use for maximum token savings
- **Pipe** (`|`): useful when data contains many commas

## Root Forms

TOON supports three root forms:
- **Root object** (most common): fields at depth 0
- **Root array**: begins with `[N]:` or `[N]{fields}:` at depth 0
- **Root primitive**: single value (string, number, boolean, null)

## Examples

### Basic tabular data
```
users[3]{id,name,role,lastLogin}:
  1,Alice,admin,2025-01-15T10:30:00Z
  2,Bob,user,2025-01-14T15:22:00Z
  3,Charlie,user,2025-01-13T09:45:00Z
```

### Tab-delimited for efficiency
```
events[2	]{id	level	message	timestamp}:
  1	error	Connection timeout	2025-01-15T10:00:00Z
  4	error	Database error	2025-01-15T10:15:00Z
```

### Mixed structure
```
config:
  version: 1.0
  features[2]: auth,logging
  servers[2]{host,port}:
    api.example.com,443
    db.example.com,5432
  metadata:
    created: 2025-01-15T00:00:00Z
    tags[3]: prod,stable,v1
```

## When to Use This Skill

Use this skill when:
- Encoding data for LLM prompts to reduce token costs
- Generating TOON output from models
- Converting between JSON and TOON formats
- Working with structured data in token-constrained contexts
- Validating TOON syntax in code or prompts

## Best Practices

1. **Show, don't describe**: When prompting LLMs, show TOON examples rather than explaining syntax
2. **Keep examples small**: Use 2-5 rows in examples, models generalize from patterns
3. **Use tab delimiters for efficiency**: `delimiter: '\t'` saves tokens
4. **Always validate output**: Use strict mode when decoding LLM-generated TOON
5. **Explicit lengths help validation**: `[N]` counts help detect truncation
6. **Minimize quoting**: Only quote when necessary per quoting rules
7. **Use tabular format when possible**: Most efficient for uniform object arrays
