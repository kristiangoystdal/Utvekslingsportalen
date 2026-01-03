<template>
  <v-card variant="tonal" rounded="xl" class="pa-5 pa-sm-6 mt-4">
    <article class="markdown-body" v-html="html" @click="onClick" />
  </v-card>
</template>

<script>
import MarkdownIt from "markdown-it"

export default {
  name: "MarkdownPanel",

  props: {
    content: { type: String, required: true },
  },

  data() {
    return {
      md: new MarkdownIt({
        html: false,
        linkify: true,
        typographer: true,
        breaks: true, // single newlines become <br>
      }),
    }
  },

  computed: {
    html() {
      return this.md.render(this.content)
    },
  },

  methods: {
    onClick(e) {
      const a = e.target.closest?.("a")
      if (!a) return

      const href = a.getAttribute("href")
      if (!href) return

      // Internal links: /privacy, /terms, /disclaimer, /legal
      if (href.startsWith("/") && !href.startsWith("//")) {
        e.preventDefault()
        this.$emit("navigate", href)
      }
    },
  },
}
</script>

<style scoped>
/* Readable line length + slightly softer text */
.markdown-body {
  max-width: 76ch;
  margin: 0 auto;
  color: rgba(0, 0, 0, 0.84);
}

/* Hide first h1 since page already has a title */
.markdown-body :deep(h1) {
  display: none;
}

/* Headings tuned for “document” style (less blog-ish spacing) */
.markdown-body :deep(h2) {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 1.35rem 0 0.5rem;
  line-height: 1.25;
}

.markdown-body :deep(h3) {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 1rem 0 0.35rem;
  line-height: 1.3;
}

/* Paragraph spacing (this fixes the “weird gaps”) */
.markdown-body :deep(p) {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  line-height: 1.65;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

/* Lists: compact + consistent */
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.25rem;
  margin: 0.5rem 0 0.85rem 0;
}

.markdown-body :deep(li) {
  margin: 0.25rem 0;
  line-height: 1.6;
}

/* Keep nested lists from looking too spaced out */
.markdown-body :deep(li > ul),
.markdown-body :deep(li > ol) {
  margin-top: 0.35rem;
  margin-bottom: 0.35rem;
}

/* Links */
.markdown-body :deep(a) {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

/* Horizontal rule */
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  margin: 1.5rem 0;
}

/* Strong emphasis slightly nicer */
.markdown-body :deep(strong) {
  font-weight: 700;
}

/* Inline code (useful if you ever include paths, keys, etc.) */
.markdown-body :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.95em;
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
}

/* Blockquotes (nice for notes) */
.markdown-body :deep(blockquote) {
  margin: 0.75rem 0 1rem;
  padding: 0.75rem 1rem;
  border-left: 4px solid rgba(var(--v-theme-primary), 0.55);
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
}
</style>
