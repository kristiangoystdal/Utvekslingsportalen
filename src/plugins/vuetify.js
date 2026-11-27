import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import { aliases, mdiIcons } from './icons';

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi: mdiIcons },
  },
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#3f72af',
          secondary: '#112d4e',
        },
      },
    },
  },
});
