export interface ExerciseVideo {
  id: string;
  title: string;
  url: string;
  duration: string;
}

export interface ExerciseCategory {
  label: string;
  color: string;
  icon: string;
  description: string;
  triggerSummary: string;
  videos: ExerciseVideo[];
}

export const exercises: Record<string, ExerciseCategory> = {
  stress_relief: {
    label: 'Stress Relief',
    color: '#7F77DD',
    icon: '🧘',
    description: 'Breathing and meditation to calm your nervous system',
    triggerSummary: 'Triggered when stress score is high',
    videos: [
      {
        id: 'sr1',
        title: 'Pregnancy Deep Breathing',
        url: 'https://youtu.be/ykijGQMtmGE?si=7irJL1oEM6_Ualmk',
        duration: '5–10 min',
      },
      {
        id: 'sr2',
        title: 'Box Breathing for Pregnancy',
        url: 'https://youtu.be/8TTABLdGCKI?si=EX65eFGNjxEDKtOu',
        duration: '5 min',
      },
      {
        id: 'sr3',
        title: 'Pregnancy Meditation',
        url: 'https://youtu.be/9SQwSqAQ9UQ?si=LsT4O8YhhIahoE9J',
        duration: '10–15 min',
      },
    ],
  },
  low_activity: {
    label: 'Light Activity',
    color: '#1D9E75',
    icon: '🚶',
    description: 'Gentle movement to improve circulation',
    triggerSummary: 'Triggered when activity index is very low',
    videos: [
      {
        id: 'la1',
        title: 'Pregnancy Walking Exercise at Home',
        url: 'https://youtu.be/JYUdpcMiLpw?si=ikCsRe7u6MxpF7Kq',
        duration: '10–15 min',
      },
      {
        id: 'la2',
        title: 'Low Impact Pregnancy Workout',
        url: 'https://youtu.be/8ONnGCHw81U?si=594pPz_0dDFsvPmn',
        duration: '20 min',
      },
      {
        id: 'la3',
        title: 'Marching in Place',
        url: 'https://youtu.be/IU7kkpXlalI?si=X9BkeKJubC6m7rAW',
        duration: '10 min',
      },
    ],
  },
  posture_correction: {
    label: 'Posture Correction',
    color: '#BA7517',
    icon: '🪑',
    description: 'Fix posture after long sitting periods',
    triggerSummary: 'Triggered when sitting too long or poor posture detected',
    videos: [
      {
        id: 'pc1',
        title: 'Pregnancy Posture Correction',
        url: 'https://youtu.be/y2vf_WJiCn4?si=EEL8jFX0ApwN7sd9',
        duration: '10 min',
      },
      {
        id: 'pc2',
        title: 'Pelvic Tilt Exercise',
        url: 'https://youtu.be/moa4h-rjuNE?si=nnJiFTn-B20i6wZ9',
        duration: '5–8 min',
      },
      {
        id: 'pc3',
        title: 'Back Pain Relief',
        url: 'https://youtu.be/nawLNMoyw-Y?si=MYcBYkAqtnQ6j8Sf',
        duration: '10 min',
      },
    ],
  },
  stretching: {
    label: 'Stretching',
    color: '#1D9E75',
    icon: '🤸',
    description: 'Gentle stretches for back and shoulders',
    triggerSummary: 'Triggered when low activity or back discomfort',
    videos: [
      {
        id: 'st1',
        title: 'Cat Cow Stretch',
        url: 'https://youtu.be/LympZqVz14s?si=nR4sdDBDZS5y8P-f',
        duration: '5 min',
      },
      {
        id: 'st2',
        title: 'Neck and Shoulder Stretch',
        url: 'https://youtu.be/NULDzTuGojU?si=_QJtl7wuPqtKyLTq',
        duration: '5–8 min',
      },
      {
        id: 'st3',
        title: 'Side Stretch During Pregnancy',
        url: 'https://youtu.be/A7ECFSH_tB8?si=AtoWszUuribexbmf',
        duration: '5 min',
      },
    ],
  },
  mobility: {
    label: 'Mobility',
    color: '#378ADD',
    icon: '🌀',
    description: 'Daily movement for joint health and wellness',
    triggerSummary: 'Triggered during normal condition for daily routine',
    videos: [
      {
        id: 'mo1',
        title: 'Hip Circles',
        url: 'https://youtube.com/shorts/GrN1mittrUk?si=UbD865brldFSh54D',
        duration: '5 min',
      },
      {
        id: 'mo2',
        title: 'Pregnancy Mobility Exercises',
        url: 'https://youtu.be/0ZgHkOWk-_8?si=DiiYmJoW7jbQVars',
        duration: '15 min',
      },
      {
        id: 'mo3',
        title: 'Gentle Pregnancy Yoga',
        url: 'https://youtu.be/jEDCvgAjR5o?si=65m-N46_FAr-d_MO',
        duration: '20–30 min',
      },
    ],
  },
  pelvic_floor: {
    label: 'Pelvic Floor',
    color: '#D4537E',
    icon: '💪',
    description: 'Essential exercises for all trimesters',
    triggerSummary: 'Always recommended — every day, all trimesters',
    videos: [
      {
        id: 'pf1',
        title: 'Kegel Exercises',
        url: 'https://youtube.com/shorts/u0FVSwnU40k?si=xSf0wVMgiH0K0sl9',
        duration: '5 min',
      },
      {
        id: 'pf2',
        title: 'Pelvic Floor Exercises',
        url: 'https://youtu.be/dtklY0Uy0Lo?si=00daS2OORHrIsj3F',
        duration: '10 min',
      },
    ],
  },
  recovery_rest: {
    label: 'Recovery & Rest',
    color: '#D85A30',
    icon: '😴',
    description: 'Rest positions when vitals are elevated',
    triggerSummary: 'Triggered when heart rate or temperature is too high',
    videos: [
      {
        id: 'rr1',
        title: 'Pregnancy Relaxation Position',
        url: 'https://youtube.com/shorts/4b-DBPcnLFE?si=FL9uZOXs9VY93Lyb',
        duration: '5–10 min',
      },
      {
        id: 'rr2',
        title: 'Pregnancy Resting Techniques',
        url: 'https://youtube.com/shorts/FVahgeRpXRM?si=TNwHNm7dFPruF8jT',
        duration: '10 min',
      },
    ],
  },
};