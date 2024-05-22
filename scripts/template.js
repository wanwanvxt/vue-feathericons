import { h } from 'vue';

export default {
  setup() {
    return () =>
      h('svg', {
        ATTRS,
        style: {
          display: 'inline-block',
          height: '1.5rem',
          width: '1.5rem',
          overflow: 'visible',
          'text-align': 'center',
          'vertical-align': 'middle'
        },
        innerHTML: CONTENT
      });
  }
};
