<template>
  <v-container class="py-10" max-width="1100">
    <v-row justify="center">
      <v-col cols="12">
        <v-card elevation="6" rounded="xl" class="pa-4 pa-sm-6">
          <!-- Header -->
          <div class="d-flex align-center justify-space-between flex-wrap mb-4">
            <div>
              <div class="text-h4 font-weight-bold">{{ $t("legal.legalPageTitle") }}</div>
              <div class="text-body-2 text-medium-emphasis">
                {{ $t("legal.legalPageDescription") }}
              </div>
            </div>

            <v-chip size="small" variant="tonal" color="primary">
              {{ $t("legal.updatedDate") }} 19-01-2026
            </v-chip>
          </div>

          <!-- Tabs -->
          <v-tabs v-model="tab" color="primary" grow>
            <v-tab value="overview">{{ $t("legal.overviewTab") }}</v-tab>
            <v-tab value="privacy">{{ $t("legal.privacyTab") }}</v-tab>
            <v-tab value="terms">{{ $t("legal.termsTab") }}</v-tab>
            <v-tab value="disclaimer">{{ $t("legal.disclaimerTab") }}</v-tab>
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
        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
