<template>
  <div>
    <h2>{{ $t("legal.legalPageTitle") }}</h2>
    <p class="page-summary mb-1">
      {{ $t("legal.legalPageDescription") }}
    </p>
    <p class="text-caption text-medium-emphasis updated-caption">
      <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
      {{ $t("legal.updatedDate") }} 19-01-2026
    </p>

    <br />

    <v-card class="legal-card" rounded="lg">
      <v-card-text class="pa-4 pa-sm-6">
        <!-- Tabs -->
        <v-tabs v-model="tab" color="primary" grow>
          <v-tab value="overview">
            <v-icon start size="18">mdi-file-document-outline</v-icon>
            {{ $t("legal.overviewTab") }}
          </v-tab>
          <v-tab value="privacy">
            <v-icon start size="18">mdi-shield-lock-outline</v-icon>
            {{ $t("legal.privacyTab") }}
          </v-tab>
          <v-tab value="terms">
            <v-icon start size="18">mdi-gavel</v-icon>
            {{ $t("legal.termsTab") }}
          </v-tab>
          <v-tab value="disclaimer">
            <v-icon start size="18">mdi-alert-circle-outline</v-icon>
            {{ $t("legal.disclaimerTab") }}
          </v-tab>
        </v-tabs>

        <v-divider class="my-4" />

        <!-- Tab content -->
        <v-window v-model="tab">
          <v-window-item value="overview">
            <MarkdownPanel v-if="this.$i18n.locale === 'en'" :content="overviewMdEn" @navigate="onNavigate" />
            <MarkdownPanel v-else :content="overviewMdNo" @navigate="onNavigate" />
          </v-window-item>

          <v-window-item value="privacy">
            <MarkdownPanel v-if="this.$i18n.locale === 'en'" :content="privacyMdEn" @navigate="onNavigate" />
            <MarkdownPanel v-else :content="privacyMdNo" @navigate="onNavigate" />
          </v-window-item>

          <v-window-item value="terms">
            <MarkdownPanel v-if="this.$i18n.locale === 'en'" :content="termsMdEn" @navigate="onNavigate" />
            <MarkdownPanel v-else :content="termsMdNo" @navigate="onNavigate" />
          </v-window-item>

          <v-window-item value="disclaimer">
            <MarkdownPanel v-if="this.$i18n.locale === 'en'" :content="disclaimerMdEn" @navigate="onNavigate" />
            <MarkdownPanel v-else :content="disclaimerMdNo" @navigate="onNavigate" />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import MarkdownPanel from "./MarkdownPanel.vue"

// Markdown imports
import overviewMdEn from "../../docs/legalEn.md?raw"
import overviewMdNo from "../../docs/legalNo.md?raw"
import privacyMdEn from "../../docs/privacyEn.md?raw"
import privacyMdNo from "../../docs/privacyNo.md?raw"
import termsMdEn from "../../docs/termsEn.md?raw"
import termsMdNo from "../../docs/termsNo.md?raw"
import disclaimerMdEn from "../../docs/disclaimerEn.md?raw"
import disclaimerMdNo from "../../docs/disclaimerNo.md?raw"

export default {
  name: "LegalTabsPage",
  components: { MarkdownPanel },

  data() {
    return {
      tab: "overview",
      overviewMdEn,
      privacyMdEn,
      termsMdEn,
      disclaimerMdEn,
      overviewMdNo,
      privacyMdNo,
      termsMdNo,
      disclaimerMdNo,
    }
  },

  mounted() {
    this.syncFromRoute()
  },

  watch: {
    "$route.query.tab"() {
      this.syncFromRoute()
    },
    tab(val) {
      if (this.$route.query.tab !== val) {
        this.$router.replace({
          query: { ...this.$route.query, tab: val },
        }).catch(() => { })
      }
    },
  },

  methods: {
    syncFromRoute() {
      const allowed = ["overview", "privacy", "terms", "disclaimer"]
      const q = (this.$route.query.tab || "").toLowerCase()
      if (allowed.includes(q)) {
        this.tab = q
      }
    },

    onNavigate(href) {
      const map = {
        "/legal": "overview",
        "/privacy": "privacy",
        "/terms": "terms",
        "/disclaimer": "disclaimer",
      }

      if (map[href]) {
        this.tab = map[href]
      } else {
        this.$router.push(href).catch(() => { })
      }
    },
  },
}
</script>

<style scoped>
.legal-card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--third-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.updated-caption {
  display: flex;
  align-items: center;
  margin: 0;
}
</style>
