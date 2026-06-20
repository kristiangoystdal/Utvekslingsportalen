<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>
        {{ title }}
      </v-card-title>
      <v-card-text>
        {{ message }}
      </v-card-text>
      <v-card-actions>
        <v-btn class="btn btn-primary" @click="emitYes">{{ $t('actions.yes') }}</v-btn>
        <v-btn class="btn btn-red" @click="emitNo">{{ $t('actions.no') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "Confirmation",
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      dialog: this.value,
      inputText: "",
    };
  },
  watch: {
    value(val) {
      this.dialog = val;
    },
    dialog(val) {
      this.$emit("input", val);
    },
  },
  methods: {
    emitYes() {
      this.$emit("yes", this.inputText);
      this.dialog = false;
    },
    emitNo() {
      this.$emit("no");
      this.dialog = false;
    },
  },
};
</script>

<style scoped>
/* Add any custom styles here */
</style>