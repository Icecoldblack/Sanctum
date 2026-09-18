/**
 * Crisis contacts. `tel:911` was previously hardcoded behind a button labelled
 * "Local Crisis Numbers", which promised a list and dialled US emergency
 * services instead. Emergency dispatch and a support hotline are different
 * things and are kept separate here.
 */

/** Police/ambulance/fire. Only for immediate physical danger. */
export const EMERGENCY_TEL = 'tel:911'

/** US domestic violence hotline — staffed by advocates, not dispatchers. */
export const HOTLINE_TEL = 'tel:18007997233'

export interface Hotline {
  name: string
  description: string
  tel: string
  display: string
}

export const hotlines: Hotline[] = [
  {
    name: 'Emergency services',
    description: 'Immediate physical danger. Police, ambulance, or fire.',
    tel: EMERGENCY_TEL,
    display: '911',
  },
  {
    name: 'National Domestic Violence Hotline',
    description: 'Free, confidential, 24/7. Advocates for safety planning and local referrals.',
    tel: HOTLINE_TEL,
    display: '1-800-799-7233',
  },
  {
    name: 'Crisis Text Line',
    description: 'Text HOME to 741741 to reach a trained crisis counselor.',
    tel: 'sms:741741?&body=HOME',
    display: 'Text HOME to 741741',
  },
  {
    name: '988 Suicide & Crisis Lifeline',
    description: 'Call or text 988 for mental health crisis support, 24/7.',
    tel: 'tel:988',
    display: '988',
  },
]
