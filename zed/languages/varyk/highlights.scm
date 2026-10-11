; Highlights for Varyk, after tree-sitter-rust's queries/highlights.scm.
;
; A copy of tree-sitter-varyk's queries/highlights.scm at the commit
; extension.toml pins, with the captures Zed names differently renamed:
; `@variable.builtin` is `@variable.special`, and `@module` is dropped.
;
; The last pattern that matches a node wins, so the patterns go from
; general to specific: every name starts as a variable, and the finer
; captures below override it.

(identifier) @variable

; Keywords. `mut`, `crate`, `super`, `pub`, `async`, `break`, and
; `continue` are named nodes, which a quoted pattern never matches.

[
  "as"
  "await"
  "else"
  "enum"
  "fn"
  "for"
  "if"
  "impl"
  "in"
  "let"
  "match"
  "mod"
  "return"
  "struct"
  "use"
  "while"
] @keyword

[
  (mutable_specifier)
  (crate)
  (super)
  (visibility_modifier)
  (function_modifiers)
  (break_expression)
  (continue_expression)
] @keyword

; Operators and punctuation.

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "!"
  "="
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "&&"
  "||"
  ".."
  "..="
  "?"
  "->"
  "=>"
] @operator

["(" ")" "[" "]" "{" "}"] @punctuation.bracket

(type_arguments ["<" ">"] @punctuation.bracket)

(closure_parameters "|" @punctuation.bracket)

["," ";" ":" "::" "."] @punctuation.delimiter

; Literals and comments.

(line_comment) @comment

(string_literal) @string

(escape_sequence) @string.escape

[(integer_literal) (float_literal)] @number

(boolean_literal) @boolean

; Types. The built-in names are a predicate on `type_identifier`, so a
; variable named `string` stays a variable.

(type_identifier) @type

((type_identifier) @type.builtin
  (#any-of? @type.builtin
    "bool" "i8" "i16" "i32" "i64" "u8" "u16" "u32" "u64" "usize" "f32" "f64"
    "string" "Option" "Result" "Vec" "HashMap" "Error" "Shared" "Task" "Time"
    "Uuid" "Bytes"))

; Fields.

(field_identifier) @property

(shorthand_field_identifier) @property

; Modules: Zed's theme has no `module` capture, so `mod` names and the
; path segments before `::` stay variables; a capitalised segment is a
; type.

((scoped_identifier path: (identifier) @type)
  (#match? @type "^[A-Z]"))
((scoped_identifier path: (scoped_identifier name: (identifier) @type))
  (#match? @type "^[A-Z]"))
((scoped_type_identifier path: (identifier) @type)
  (#match? @type "^[A-Z]"))
((scoped_type_identifier path: (scoped_identifier name: (identifier) @type))
  (#match? @type "^[A-Z]"))

; Functions and methods.

(function_item name: (identifier) @function)

(call_expression function: (identifier) @function)

(call_expression
  function: (scoped_identifier name: (identifier) @function))

(call_expression
  function: (field_expression field: (field_identifier) @function.method))

(impl_item
  body: (declaration_list (function_item name: (identifier) @function.method)))

; Constructors: enum variants, `Some`/`None`/`Ok`/`Err`, and capitalised
; names in call, path, and pattern positions.

(enum_variant name: (identifier) @constructor)

((call_expression function: (identifier) @constructor)
  (#match? @constructor "^[A-Z]"))

((scoped_identifier name: (identifier) @constructor)
  (#match? @constructor "^[A-Z]"))

(tuple_struct_pattern type: (identifier) @constructor)

(struct_pattern
  type: (scoped_type_identifier name: (type_identifier) @constructor))

((match_arm pattern: (identifier) @constructor)
  (#match? @constructor "^[A-Z]"))

((let_condition pattern: (identifier) @constructor)
  (#match? @constructor "^[A-Z]"))

((identifier) @constructor
  (#any-of? @constructor "Some" "None" "Ok" "Err"))

; A `use` never ends at a variant (V0111), so a capitalised last segment
; there is a struct or an enum.

((use_declaration argument: (scoped_identifier name: (identifier) @type))
  (#match? @type "^[A-Z]"))
((use_as_clause path: (scoped_identifier name: (identifier) @type))
  (#match? @type "^[A-Z]"))

; Macros.

(macro_invocation
  macro: (identifier) @function.macro
  "!" @function.macro)

; Parameters.

(parameter pattern: (identifier) @variable.parameter)

(closure_parameters (identifier) @variable.parameter)

; Attributes and `self`.

(attribute (identifier) @attribute)

(self) @variable.special
