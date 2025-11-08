import { defineStore } from 'pinia';
import { ref } from 'vue';

const colorPalette = [
  'primary',
  'secondary',
  'accent',
  'positive',
  'negative',
  'info',
  'warning',
  'red-5',
  'pink-5',
  'purple-5',
  'deep-purple-5',
  'indigo-5',
  'blue-5',
  'light-blue-5',
  'cyan-5',
  'teal-5',
  'green-5',
  'light-green-5',
  'lime-5',
  'yellow-5',
  'amber-5',
  'orange-5',
  'deep-orange-5',
  'brown-5',
  'grey-5',
  'blue-grey-5',
];

export const useScreensaverStore = defineStore('screensaver', () => {
  const toolbarColor = ref('primary');
  const buttonColor = ref('white'); // for text/icon color on flat buttons

  const getRandomColor = () => {
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
  };

  function randomizeColors() {
    toolbarColor.value = getRandomColor()!;
    // For simplicity, let's keep button/text color as white, which works for most dark/colored backgrounds
    // A more complex logic could check luminance to decide between white/black.
    buttonColor.value = 'white';
  }

  function resetColors() {
    toolbarColor.value = 'primary';
    buttonColor.value = 'white';
  }

  return {
    toolbarColor,
    buttonColor,
    randomizeColors,
    resetColors,
  };
});
