import mongoose from 'mongoose';
import { env } from './config/env';
import { GuidanceRule } from './infrastructure/database/models';

const seedData = [
  {
    minWeek: 1,
    maxWeek: 4,
    nutritionTips: [
      'Focus on folate-rich foods: leafy greens (spinach, kale), citrus fruits, beans, lentils, and fortified cereals.',
      'Ensure a steady intake of calcium through yogurt, cheese, or fortified plant milks.',
      'Avoid high-risk foods: raw eggs, unpasteurized dairy, undercooked meat, and sushi.'
    ],
    hydrationTips: [
      'Drink 8-10 cups (approx. 2.3 liters) of filtered water daily to support expanding blood volume.',
      'Limit caffeine intake to a maximum of 200mg per day (about one 12 oz cup of coffee).'
    ],
    exerciseTips: [
      'Engage in light exercises like brisk walking (20-30 minutes) and gentle stretching.',
      'Incorporate pelvic floor exercises (Kegels) to build core strength.',
      'Avoid high-impact, high-intensity workouts or anything that puts you at risk of falling.'
    ],
    medicalTests: [
      'Confirm pregnancy with a beta-hCG blood test.',
      'Initial baseline blood tests: check blood type, Rh factor, and screen for iron-deficiency anemia.'
    ],
    doctorVisits: [
      'Schedule your first official prenatal appointment (ideally around week 8, but call now to book).'
    ],
    precautions: [
      'Stop all consumption of alcohol and tobacco immediately.',
      'Consult your healthcare provider before taking any over-the-counter medications or supplements.'
    ]
  },
  {
    minWeek: 5,
    maxWeek: 8,
    nutritionTips: [
      'Eat small, frequent meals throughout the day to combat nausea and morning sickness.',
      'Incorporate ginger products (ginger tea, ginger lozenges) and Vitamin B6 to alleviate nausea.',
      'Avoid greasy, spicy, or highly acidic foods that can trigger acid reflux.'
    ],
    hydrationTips: [
      'Keep hydrated with water, coconut water, or weak herbal teas. Small, frequent sips are easier to keep down.',
      'Add lemon slices to your water to help settle a nauseous stomach.'
    ],
    exerciseTips: [
      'Continue with low-impact exercises: prenatal yoga, swimming, or walking.',
      'Listen to your body; rest immediately if you feel fatigued or dizzy.'
    ],
    medicalTests: [
      'Perform a viability ultrasound (dating scan) to confirm the fetal heartbeat and gestational age.',
      'Full prenatal blood panel: check immunity levels for Rubella, chickenpox, and screen for HIV, Syphilis, and Hepatitis B.'
    ],
    doctorVisits: [
      'Attend the first comprehensive prenatal checkup: discuss medical history, calculate expected delivery date (EDD), and review current symptoms.'
    ],
    precautions: [
      'Do not clean cat litter boxes to avoid toxoplasmosis risk; delegate this task or wear gloves.',
      'Avoid saunas, hot tubs, and steam rooms; high body temperatures can increase risk of birth defects.'
    ]
  },
  {
    minWeek: 9,
    maxWeek: 12,
    nutritionTips: [
      'Incorporate iron-rich foods: lean meats, poultry, beans, iron-fortified cereals, and spinach.',
      'Eat vitamin C-rich foods (strawberries, bell peppers, oranges) alongside iron foods to enhance absorption.'
    ],
    hydrationTips: [
      'Maintain an intake of at least 10 cups of liquids per day.',
      'Avoid carbonated and sugary drinks to prevent bloating and excess empty calories.'
    ],
    exerciseTips: [
      'Aim for 150 minutes of moderate-intensity exercise per week (e.g., walking 30 minutes, 5 days a week).',
      'Incorporate exercises that strengthen the back and core to prepare for carrying extra weight.'
    ],
    medicalTests: [
      'Consider Non-Invasive Prenatal Testing (NIPT) from week 10 onwards to screen for chromosomal abnormalities.',
      'First Trimester Screening (Nuchal Translucency ultrasound and blood test) between weeks 11-13.'
    ],
    doctorVisits: [
      'Attend your monthly prenatal checkup: monitor maternal weight, check blood pressure, and listen to the baby\'s heartbeat with a Doppler.'
    ],
    precautions: [
      'Avoid exercises where you lie flat on your back after week 12 (this can compress the vena cava, reducing blood flow to you and the baby).',
      'Ensure workspace ergonomics are set up comfortably to minimize back strain.'
    ]
  },
  {
    minWeek: 13,
    maxWeek: 16,
    nutritionTips: [
      'Increase caloric intake slightly by approximately 300 calories/day of nutrient-dense foods.',
      'Consume high-fiber foods (whole grains, vegetables, berries) to prevent pregnancy-induced constipation.'
    ],
    hydrationTips: [
      'Drink 10 cups of water daily. Amniotic fluid regenerates completely every few hours, requiring consistent hydration.',
      'Drink a glass of water before, during, and after any physical activity.'
    ],
    exerciseTips: [
      'Start prenatal pilates with modifications to avoid lying flat or overstretching abdominal muscles.',
      'Practice regular pelvic tilts to ease lower back discomfort.'
    ],
    medicalTests: [
      'Second trimester screening (Quad screen) to assess risks for neural tube defects and genetic conditions (if NIPT was not done).'
    ],
    doctorVisits: [
      'Attend month 4 prenatal checkup: measure fundal height (uterine size) and check fetal heart rate.'
    ],
    precautions: [
      'Wear supportive, low-heeled footwear as your center of gravity starts to shift.',
      'Avoid contact sports, heavy lifting, and activities with a high risk of falling.'
    ]
  },
  {
    minWeek: 17,
    maxWeek: 20,
    nutritionTips: [
      'Ensure adequate intake of Omega-3 fatty acids (DHA/EPA) from low-mercury fish (salmon, sardines) or algae supplements for baby\'s brain development.',
      'Maintain calcium levels to assist in the development of the baby\'s bones and teeth.'
    ],
    hydrationTips: [
      'Continue drinking at least 10 cups of water daily.',
      'Drink water when you feel maternal heat or sweating; pregnancy increases metabolic rate and sweat production.'
    ],
    exerciseTips: [
      'Incorporate squats (using a wall or chair for balance) to strengthen leg muscles for labor.',
      'Incorporate chest expansions and shoulder stretches to offset forward posture pull.'
    ],
    medicalTests: [
      'Schedule and perform the Mid-Pregnancy Anatomy Scan (Level 2 Ultrasound) between weeks 18-22 to examine fetal organs, limbs, and placenta position.'
    ],
    doctorVisits: [
      'Attend month 5 prenatal checkup: review anatomy scan results, evaluate maternal blood pressure, weight, and check urine for protein.'
    ],
    precautions: [
      'Watch out for round ligament pain (sharp pains in side or lower abdomen). Move slowly when standing up from sitting or lying down.',
      'Sleep on your side, preferably the left side, using pillows between your knees for hip alignment.'
    ]
  },
  {
    minWeek: 21,
    maxWeek: 24,
    nutritionTips: [
      'Monitor sodium intake to avoid excessive fluid retention and swelling.',
      'Increase protein intake with lean meats, eggs, tofu, nuts, and dairy products to support rapid tissue growth.'
    ],
    hydrationTips: [
      'Drink 10-12 cups of water. Watch out for signs of urinary tract infections (UTIs) like painful urination, which are more common in pregnancy and require prompt hydration and medical attention.'
    ],
    exerciseTips: [
      'Continue walking, swimming, and modified strength training. Keep the intensity conversational (you should be able to speak a full sentence without gasping).',
      'Incorporate cat-cow stretches to release back tension.'
    ],
    medicalTests: [
      'Gestational Diabetes Screening (Glucose Challenge Test) between weeks 24-28.',
      'Repeat Complete Blood Count (CBC) to screen for second-trimester anemia.'
    ],
    doctorVisits: [
      'Attend month 6 prenatal checkup: measure fundal height, monitor blood pressure, and assess fetal movement (quickening).'
    ],
    precautions: [
      'Avoid prolonged standing or sitting. Take frequent breaks to walk and stretch to improve circulation and prevent blood clots.',
      'Avoid heavy lifting or pushing objects over 20 lbs.'
    ]
  },
  {
    minWeek: 25,
    maxWeek: 28,
    nutritionTips: [
      'Focus on foods high in zinc and iron (beans, nuts, red meat, pumpkin seeds).',
      'Eat small, nutrient-dense meals to avoid severe heartburn as the uterus pushes up against your stomach.'
    ],
    hydrationTips: [
      'Stay well-hydrated to reduce the frequency and intensity of Braxton Hicks contractions (mild, irregular contractions that prepare the uterus for labor).'
    ],
    exerciseTips: [
      'Switch to gentle, low-impact movements if heavy cardio is causing pelvic pressure.',
      'Swimming is highly recommended as it relieves pressure on the spine and joints.'
    ],
    medicalTests: [
      'Glucose Tolerance Test (if the initial challenge test was elevated).',
      'Rh Antibody Screen: Rhogam injection at week 28 if mother is Rh-negative.'
    ],
    doctorVisits: [
      'Attend prenatal visit: Check fundal height, check maternal blood pressure, and listen to the fetal heart rate.',
      'Transition to bi-weekly prenatal checkups (every 2 weeks) starting from week 28.'
    ],
    precautions: [
      'Learn the signs of preeclampsia (sudden swelling of hands and face, severe headaches, vision changes, upper abdominal pain) and report immediately if present.',
      'Monitor baby\'s movements daily. Understand how to perform kick counts.'
    ]
  },
  {
    minWeek: 29,
    maxWeek: 32,
    nutritionTips: [
      'Eat foods rich in Vitamin C to keep blood vessels healthy and support iron absorption.',
      'Focus on healthy fats (avocado, olive oil) to assist in the baby\'s rapid brain growth and fat layer development.'
    ],
    hydrationTips: [
      'Dehydration is a common trigger for premature labor. Keep a water bottle with you at all times.',
      'Drink warm water or herbal teas (like raspberry leaf tea, if approved by your doctor) in the evening.'
    ],
    exerciseTips: [
      'Use a birth ball (stability ball) for sitting, pelvic rocks, and gentle bouncing to help align the pelvis.',
      'Continue with light walking and deep breathing exercises.'
    ],
    medicalTests: [
      'Regular urinalysis at every visit to check for protein (preeclampsia screen) and glucose (diabetes monitor).'
    ],
    doctorVisits: [
      'Attend bi-weekly prenatal appointments: monitor baby\'s growth and check if the baby is transitioning to a head-down position.'
    ],
    precautions: [
      'Avoid lifting heavy loads or bending directly from the waist; bend at the knees.',
      'Be aware of the signs of preterm labor: fluid leaking, pelvic pressure, low backache, and regular rhythmic contractions.'
    ]
  },
  {
    minWeek: 33,
    maxWeek: 36,
    nutritionTips: [
      'Focus on calcium-rich foods to help the baby\'s bones solidify.',
      'Eat vitamin K-rich foods (leafy greens, broccoli) which assist in blood clotting capabilities.'
    ],
    hydrationTips: [
      'Ensure at least 10-12 cups of water. Hydration helps flush out toxins and reduces edema (swelling) in the feet and ankles.'
    ],
    exerciseTips: [
      'Focus on pelvic opening stretches (butterfly stretch, gentle squats).',
      'Practice slow, controlled labor breathing techniques.'
    ],
    medicalTests: [
      'Group B Streptococcus (GBS) vaginal/rectal swab screening between weeks 35-37.'
    ],
    doctorVisits: [
      'Attend prenatal checkup: assess baby\'s position (confirm head-down). Check maternal blood pressure and weight.',
      'Prepare to transition to weekly prenatal checkups starting at week 36.'
    ],
    precautions: [
      'Avoid traveling long distances or flying. Pack your hospital bag and place it near the door.',
      'Ensure the infant car seat is installed correctly in your vehicle and inspected.'
    ]
  },
  {
    minWeek: 37,
    maxWeek: 40,
    nutritionTips: [
      'Eat easily digestible, high-energy foods (dates, bananas, whole grains) to store glycogen for the physical demands of labor.',
      'Eat small snacks rather than large meals, as space in the abdomen is highly restricted.'
    ],
    hydrationTips: [
      'Keep hydrated. If early labor starts, drinking water or clear fluids will maintain your stamina and muscle function.'
    ],
    exerciseTips: [
      'Walk daily. Walking utilizes gravity to help the baby\'s head settle deeper into the pelvis, encouraging cervical dilation.',
      'Rest and conserve your energy; avoid intense workouts.'
    ],
    medicalTests: [
      'Cervical exams (optional) to assess dilation (opening) and effacement (thinning).',
      'Non-Stress Test (NST) or Biophysical Profile (BPP) if you go past your due date or have high-risk indicators.'
    ],
    doctorVisits: [
      'Attend weekly prenatal appointments. Discuss birth plan preferences, pain management options, and signs of active labor.'
    ],
    precautions: [
      'Monitor fetal movements. If you notice a sudden decrease in kicks or movement, contact your provider immediately.',
      'Go to the hospital or contact your doctor immediately if: your water breaks (fluid leak), you experience bright red bleeding, or your contractions are 5 minutes apart, lasting 1 minute, for at least 1 hour.'
    ]
  }
];

async function seed() {
  try {
    console.log('🔄 Connecting to database for seeding...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('🧹 Clearing existing guidance rules...');
    await GuidanceRule.deleteMany({});
    console.log('🗑️ Cleaned guidanceRules collection.');

    console.log('🌱 Seeding guidance rules...');
    const result = await GuidanceRule.insertMany(seedData);
    console.log(`🎉 Successfully seeded ${result.length} guidance rules.`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
