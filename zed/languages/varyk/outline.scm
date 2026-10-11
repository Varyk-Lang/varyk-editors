(function_item
  (visibility_modifier)? @context
  (function_modifiers)? @context
  "fn" @context
  name: (_) @name) @item

(struct_item
  (visibility_modifier)? @context
  "struct" @context
  name: (_) @name) @item

(enum_item
  (visibility_modifier)? @context
  "enum" @context
  name: (_) @name) @item

(impl_item
  "impl" @context
  type: (_) @name) @item

(mod_item
  (visibility_modifier)? @context
  "mod" @context
  name: (_) @name) @item
