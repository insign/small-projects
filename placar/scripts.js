/* Lógica da Aplicação Placar Interativo */

// --- LÓGICA DE TELA CHEIA (ISOLADA) ---
function handleFullscreenRequest() {
  const docEl = document.documentElement
  if (docEl.requestFullscreen) {
    docEl.requestFullscreen()
  } else if (docEl.webkitRequestFullscreen) {
    docEl.webkitRequestFullscreen()
  }
}

function updateFullscreenUI() {
  const overlay = document.getElementById('fullscreen-overlay')
  if (!overlay) return

  if (document.fullscreenElement || document.webkitFullscreenElement) {
    overlay.classList.add('hidden')
  } else {
    overlay.classList.remove('hidden')
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('fullscreen-overlay')
  const docEl = document.documentElement
  if (!docEl.requestFullscreen && !docEl.webkitRequestFullscreen) {
    if (overlay) overlay.remove()
  } else {
    document.addEventListener('fullscreenchange', updateFullscreenUI)
    document.addEventListener('webkitfullscreenchange', updateFullscreenUI)
    updateFullscreenUI()
  }
})

// --- LÓGICA PRINCIPAL DA APLICAÇÃO (VUE) ---
const { createApp } = Vue

createApp({
  data() {
    return {
      scoreA: 0,
      scoreB: 0,
      isTeamOrderSwapped: false,
      texts: {},
      timerTotalSeconds: 0,
      timerIsRunning: false,
      timerId: null,
      wakeLock: null,
      longPressTimer: null,
      isLongPress: false,
      longPressDuration: 500,
      orientationMediaQuery: null,
      isHelpVisible: false,
    }
  },
  computed: {
    currentTeamAName() {
      if (!this.texts.team_a_name) return ''
      return this.isTeamOrderSwapped ? this.texts.team_b_name : this.texts.team_a_name
    },
    currentTeamBName() {
      if (!this.texts.team_b_name) return ''
      return this.isTeamOrderSwapped ? this.texts.team_a_name : this.texts.team_b_name
    },
    formattedTime() {
      const minutes = Math.floor(this.timerTotalSeconds / 60)
      const seconds = this.timerTotalSeconds % 60
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    },
  },
  methods: {
    initializeI18n() {
      const defaultTexts = {
        team_a_name: 'DOOR',
        team_b_name: 'BACK',
        reset_title: 'Reset Scores & Pause Timer',
        help_title: 'Help',
        help_increase: 'Click to increase score',
        help_decrease: 'Click and hold to decrease',
        help_swap: 'Tap the timer to swap teams',
        help_creator: 'Created by <a href="https://helio.me" target="_blank">Hélio</a>',
        fullscreen_button_text: 'Enter Fullscreen'
      }

      const translations = {
        zh: {
          team_a_name: '近', team_b_name: '远', reset_title: '重置比分并暂停计时器', help_title: '帮助',
          help_increase: '点击增加分数', help_decrease: '长按减少分数', help_swap: '点击计时器交换队伍',
          help_creator: '由 <a href="https://helio.me" target="_blank">Hélio</a> 创建', fullscreen_button_text: '进入全屏'
        },
        es: {
          team_a_name: 'PUERTA', team_b_name: 'FONDO', reset_title: 'Reiniciar Puntos y Pausar Cronómetro', help_title: 'Ayuda',
          help_increase: 'Clic para aumentar', help_decrease: 'Mantén presionado para disminuir', help_swap: 'Toca el cronómetro para cambiar equipos',
          help_creator: 'Creado por <a href="https://helio.me" target="_blank">Hélio</a>', fullscreen_button_text: 'Pantalla Completa'
        },
        hi: {
          team_a_name: 'पास', team_b_name: 'दूर', reset_title: 'स्कोर रीसेट करें और टाइमर रोकें', help_title: 'मदद',
          help_increase: 'स्कोर बढ़ाने के लिए क्लिक करें', help_decrease: 'घटाने के लिए दबाकर रखें', help_swap: 'टीमें बदलने के लिए टाइमर पर टैप करें',
          help_creator: '<a href="https://helio.me" target="_blank">Hélio</a> द्वारा बनाया गया', fullscreen_button_text: 'फ़ुलस्क्रीन करें'
        },
        ar: {
          team_a_name: 'قريب', team_b_name: 'بعيد', reset_title: 'إعادة تعيين النقاط وإيقاف المؤقت', help_title: 'مساعدة',
          help_increase: 'انقر لزيادة النتيجة', help_decrease: 'اضغط مع الاستمرار للتقليل', help_swap: 'اضغط على المؤقت لتبديل الفرق',
          help_creator: 'صنعه <a href="https://helio.me" target="_blank">Hélio</a>', fullscreen_button_text: 'دخول وضع ملء الشاشة'
        },
        bn: {
          team_a_name: 'কাছে', team_b_name: 'দূরে', reset_title: 'স্কোর রিসেট করুন এবং টাইমার থামান', help_title: 'সাহায্য',
          help_increase: 'স্কোর বাড়াতে ক্লিক করুন', help_decrease: 'কমাতে চেপে ধরুন', help_swap: 'দল বদল করতে টাইমার ট্যাপ করুন',
          help_creator: '<a href="https://helio.me" target="_blank">Hélio</a> দ্বারা নির্মিত', fullscreen_button_text: 'পূর্ণ স্ক্রীন'
        },
        pt: {
          team_a_name: 'PORTA', team_b_name: 'FUNDO', reset_title: 'Zerar Placar e Pausar Cronômetro', help_title: 'Ajuda',
          help_increase: 'Clique para aumentar', help_decrease: 'Clique e segure para diminuir', help_swap: 'Toque no cronômetro para inverter os times',
          help_creator: 'Criado por <a href="https://helio.me" target="_blank">Hélio</a>', fullscreen_button_text: 'Entrar em Tela Cheia'
        },
        ru: {
          team_a_name: 'БЛИЖНИЙ', team_b_name: 'ДАЛЬНИЙ', reset_title: 'Сбросить счет и остановить таймер', help_title: 'Помощь',
          help_increase: 'Нажмите, чтобы увеличить счет', help_decrease: 'Нажмите и удерживайте, чтобы уменьшить', help_swap: 'Нажмите на таймер, чтобы поменять команды',
          help_creator: 'Создано <a href="https://helio.me" target="_blank">Hélio</a>', fullscreen_button_text: 'Во весь экран'
        },
        ur: {
          team_a_name: 'قریب', team_b_name: 'دور', reset_title: 'سکور دوبارہ ترتیب دیں اور ٹائمر روکیں', help_title: 'مدد',
          help_increase: 'سکور بڑھانے کے لیے کلک کریں', help_decrease: 'کم کرنے کے لیے دبا کر رکھیں', help_swap: 'ٹیمیں تبدیل کرنے کے لیے ٹائمر پر ٹیپ کریں',
          help_creator: '<a href="https://helio.me" target="_blank">Hélio</a> نے بنایا', fullscreen_button_text: 'پوری اسکرین'
        },
        id: {
          team_a_name: 'PINTU', team_b_name: 'BELAKANG', reset_title: 'Atur Ulang Skor & Jeda Timer', help_title: 'Bantuan',
          help_increase: 'Klik untuk menambah skor', help_decrease: 'Klik dan tahan untuk mengurangi', help_swap: 'Ketuk timer untuk menukar tim',
          help_creator: 'Dibuat oleh <a href="https://helio.me" target="_blank">Hélio</a>', fullscreen_button_text: 'Masuk Layar Penuh'
        },
        fr: {
          team_a_name: 'PORTE', team_b_name: 'FOND', reset_title: 'Réinitialiser les scores et pauser le chrono', help_title: 'Aide',
          help_increase: 'Cliquer pour augmenter', help_decrease: 'Maintenir pour diminuer', help_swap: 'Appuyez sur le chrono pour changer d\'équipe',
          help_creator: 'Créé par <a href="https://helio.me" target="_blank">Hélio</a>', fullscreen_button_text: 'Plein écran'
        }
      }

      const lang = (navigator.language || navigator.userLanguage).split('-')[0]
      this.texts = translations[lang] || defaultTexts

      const fullscreenBtn = document.getElementById('fullscreen-button')
      if (fullscreenBtn) {
        fullscreenBtn.textContent = this.texts.fullscreen_button_text
      }
    },
    toggleHelp() {
      this.isHelpVisible = !this.isHelpVisible
    },
    applyChromeRotationFix() {
      const isChromeMobile = /Chrome/.test(navigator.userAgent) && /Mobi/.test(navigator.userAgent)
      const isPortrait = this.orientationMediaQuery.matches
      const wrapper = document.getElementById('rotation-wrapper')

      if (wrapper) {
        if (isChromeMobile && isPortrait) {
          wrapper.classList.add('force-landscape-chrome')
        } else {
          wrapper.classList.remove('force-landscape-chrome')
        }
      }
    },
    swapTeamNames() {
      this.isTeamOrderSwapped = !this.isTeamOrderSwapped
    },
    resetGame() {
      this.scoreA = 0
      this.scoreB = 0
      this.pauseTimer()
    },
    startTimer() {
      if (this.timerIsRunning) return
      this.timerIsRunning = true
      this.requestWakeLock()
      this.timerId = setInterval(() => { this.timerTotalSeconds++ }, 1000)
    },
    pauseTimer() {
      this.timerIsRunning = false
      clearInterval(this.timerId)
      this.releaseWakeLock()
    },
    async requestWakeLock() {
      if ("wakeLock" in navigator) {
        try {
          this.wakeLock = await navigator.wakeLock.request("screen")
          this.wakeLock.addEventListener("release", () => {})
        } catch (err) {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`)
        }
      }
    },
    async releaseWakeLock() {
      if (this.wakeLock !== null) {
        try {
          await this.wakeLock.release()
          this.wakeLock = null
        } catch (err) {
          console.error(`Wake Lock release error: ${err.name}, ${err.message}`)
        }
      }
    },
    incrementScore(team) {
      const wasGameAtZero = this.scoreA === 0 && this.scoreB === 0

      if (team === "A") this.scoreA++
      else this.scoreB++

      if (wasGameAtZero) {
        this.timerTotalSeconds = 30
        this.startTimer()
      }
    },
    decrementScore(team) {
      if (team === "A" && this.scoreA > 0) this.scoreA--
      else if (team === "B" && this.scoreB > 0) this.scoreB--
    },
    pressStart(team) {
      this.isLongPress = false
      this.longPressTimer = setTimeout(() => {
        this.decrementScore(team)
        this.isLongPress = true
      }, this.longPressDuration)
    },
    pressEnd(team) {
      clearTimeout(this.longPressTimer)
      if (!this.isLongPress) this.incrementScore(team)
    },
    handleVisibilityChange() {
      if (this.wakeLock !== null && document.visibilityState === "visible") {
        this.requestWakeLock()
      }
    },
  },
  mounted() {
    this.initializeI18n()
    document.addEventListener("visibilitychange", this.handleVisibilityChange)
    this.orientationMediaQuery = window.matchMedia("(orientation: portrait)")
    this.orientationMediaQuery.addEventListener('change', this.applyChromeRotationFix)
    this.applyChromeRotationFix()
  },
  beforeUnmount() {
    this.pauseTimer()
    document.removeEventListener("visibilitychange", this.handleVisibilityChange)
    if (this.orientationMediaQuery) {
      this.orientationMediaQuery.removeEventListener('change', this.applyChromeRotationFix)
    }
  },
}).mount("#app")


// --- REGISTRO DO SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
             .then(registration => {
               console.log('ServiceWorker registrado com sucesso:', registration.scope);
             })
             .catch(error => {
               console.log('Falha ao registrar ServiceWorker:', error);
             });
  });
}