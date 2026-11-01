// ============================================================
// DATOS DEL SITIO — CONTENIDO DE EJEMPLO
// TODO: reemplazar TODO este contenido con los datos reales de la
// clínica (PROMPT.md §0 y regla 12.6). Todo lo marcado con TODO
// es de muestra: nombres, precios, testimonios y cifras no son reales.
// En producción estos datos viven en el almacenamiento real (experimento
// de memoria/localStorage) y se editan desde el panel admin (Fase 3).
// ============================================================

export interface Service {
  slug: string;
  name: string;
  category: string; // clave de ServiceCategory
  duration: number; // minutos
  buffer: number; // minutos de descanso entre sesiones
  modalities: ("presencial" | "enlinea")[];
  description: string;
  forWho: string;
  whatToExpect: string;
  faq: { q: string; a: string }[];
  relatedResource?: string; // slug de recurso gratuito relacionado
}

export const serviceCategories = [
  { key: "psicologia", label: "Terapia psicológica" },
  { key: "masajes", label: "Masajes terapéuticos" },
  { key: "medicina-china", label: "Medicina china" },
  { key: "nutricion", label: "Nutrición" },
];

export const services: Service[] = [
  {
    slug: "terapia-individual",
    name: "Terapia psicológica individual",
    category: "psicologia",
    duration: 50,
    buffer: 10,
    modalities: ["presencial", "enlinea"],
    description:
      "Acompañamiento profesional para ansiedad, estrés, duelo, autoestima y dificultades en las relaciones, con un enfoque humano y sin juicios.",
    forWho:
      "Personas que atraviesan malestar emocional sostenido, estrés agotador o un momento de vida que les cuesta manejar por sí solas.",
    whatToExpect:
      "En la primera sesión se conversa sin prisas para entender qué te trae y acordar un plan de trabajo. Cada sesión dura 50 minutos y se puede atender en la clínica o en línea.",
    faq: [
      { q: "¿Cuántas sesiones necesito?", a: "Depende de lo que quieras trabajar. Se acuerda juntos al inicio y se revisa periódicamente." },
      { q: "¿La terapia en línea funciona igual?", a: "Para la mayoría de las consultas, sí. Se usa videollamada y la frecuencia puede ser igual o menor que en persona." },
      { q: "¿Es confidencial?", a: "Sí. Toda la información que compartes es confidencial, conforme al aviso de privacidad y al código de ética profesional." },
    ],
    relatedResource: "respiracion-478",
  },
  {
    slug: "terapia-pareja",
    name: "Terapia de pareja",
    category: "psicologia",
    duration: 60,
    buffer: 10,
    modalities: ["presencial", "enlinea"],
    description:
      "Trabajo conjunto para mejorar la comunicación, resolver conflictos recurrentes y reconstruir la confianza en la relación.",
    forWho:
      "Parejas (casadas o de hecho) que sienten que discuten lo mismo una y otra vez, o que atraviesan un momento de distancia.",
    whatToExpect:
      "Sesiones de 60 minutos donde ambos participan. El objetivo no es tener la razón, sino entender cómo se están dañando mutuamente y construir acuerdos que funcionen.",
    faq: [
      { q: "¿Podemos venir por separado al inicio?", a: "Sí, es común empezar con una sesión individual con cada persona y luego trabajar juntos." },
      { q: "¿Cuánto dura una terapia de pareja?", a: "No hay una duración fija: se define con base en lo que ambos quieran lograr." },
    ],
    relatedResource: "meditacion-gratitud",
  },
  {
    slug: "terapia-familiar",
    name: "Terapia familiar",
    category: "psicologia",
    duration: 60,
    buffer: 10,
    modalities: ["presencial"],
    description:
      "Acompañamiento para dinámicas familiares que generan conflicto: crianza, límites, comunicación entre generaciones y crisis.",
    forWho:
      "Familias con conflictos sostenidos, dificultades en la crianza o tras un cambio importante (divorcio, enfermedad, mudanza).",
    whatToExpect:
      "Sesiones de 60 minutos en las que se trabaja con la familia completa o con los miembros clave, buscando que cada persona se sienta escuchada.",
    faq: [
      { q: "¿Participan los hijos?", a: "Según su edad y lo que convenga para cada caso. A veces se trabaja con los padres y se integra a los niños en sesiones específicas." },
      { q: "¿Es solo para divorcios?", a: "No. También sirve para mejorar la comunicación y resolver conflictos cotidianos." },
    ],
  },
  {
    slug: "masaje-terapeutico",
    name: "Masaje terapéutico",
    category: "masajes",
    duration: 50,
    buffer: 15,
    modalities: ["presencial"],
    description:
      "Técnicas manuales para liberar tensión muscular, mejorar la circulación y acompañar el recupero de lesiones musculares.",
    forWho:
      "Personas con tensión crónica en cuello, espalda o espalda baja, dolor por postura o sedentarismo, o que buscan un complemento a su tratamiento.",
    whatToExpect:
      "Sesión de 50 minutos. En la primera se toma un historial breve y se evalúa dónde hay tensión. El trabajo se adapta a tu nivel de dolor y comodidad.",
    faq: [
      { q: "¿Duele?", a: "Puede sentirse presión intensa en zonas de tensión, pero nunca debe ser dolor insoportable. Todo se ajusta a lo que puedes tolerar." },
      { q: "¿Cuántas sesiones necesito?", a: "Depende de la condición. Generalmente se trabaja por series de 4 a 8 sesiones con intervalos definidos." },
      { q: "¿Contra qué sirve?", a: "No sustituye la atención médica. Es un complemento para dolor muscular y tensiones, con contraindicaciones que se revisan en la evaluación inicial." },
    ],
    relatedResource: "estiramientos-cuello",
  },
  {
    slug: "medicina-china",
    name: "Acupuntura y TENS",
    category: "medicina-china",
    duration: 60,
    buffer: 15,
    modalities: ["presencial"],
    description:
      "Acupuntura clásica y electroacupuntura (TENS) para el manejo de dolor, tensión y desequilibrios, con evaluación previa.",
    forWho:
      "Personas con dolor de espalda o cuello, cefaleas, tensión o que buscan un enfoque complementario a su tratamiento actual.",
    whatToExpect:
      "Sesión de 60 minutos: primero una evaluación (pulso, lengua, historial) y luego la aplicación de agujas finas o electroacupuntura en los puntos indicados.",
    faq: [
      { q: "¿Duele la acupuntura?", a: "Se puede sentir un pinchazo leve al insertar la aguja; después suele ser una sensación de calor o pesadez. La mayoría la describe como placentera." },
      { q: "¿Es segura?", a: "Con profesionales capacitados, sí. Se usan agujas desechables y se revisan contraindicaciones (embarazo, anticoagulantes, marcapasos).", },
      { q: "¿Con qué frecuencia debo venir?", a: "Se define en la evaluación inicial y se ajusta según la evolución." },
    ],
    relatedResource: "respiracion-diafragmatica",
  },
  {
    slug: "nutricion",
    name: "Nutrición y bienestar",
    category: "nutricion",
    duration: 40,
    buffer: 10,
    modalities: ["presencial", "enlinea"],
    description:
      "Acompañamiento nutricional enfocado en hábitos sostenibles: energía, digestión, peso y relación con la comida, sin dietas punitivas.",
    forWho:
      "Personas que quieren mejorar su energía y digestión, regular su peso o entender mejor qué comen y cómo.",
    whatToExpect:
      "Sesiones de 40 minutos: se analiza tu historial, hábitos y objetivos, y se construye un plan con ajustes pequeños y realistas. Incluye seguimiento.",
    faq: [
      { q: "¿Me dan una lista de alimentos prohibidos?", a: "No. Se trabaja con ajustes graduales y con tu contexto real (tiempo, presupuesto, gustos).", },
      { q: "¿Puede ser en línea?", a: "Sí, y funciona muy bien para seguimiento y ajustes de hábitos." },
    ],
    relatedResource: "caminata-consciente",
  },
];

export interface Professional {
  id: string;
  name: string; // TODO: nombre real
  role: string; // TODO: título real
  services: string[]; // slugs de servicio
  days: number[]; // 1=lunes ... 6=sábado
  open: number; // hora de apertura (24h)
  close: number; // hora de cierre (24h)
  saturday?: { open: number; close: number };
}

export const professionals: Professional[] = [
  {
    id: "dra",
    name: "Dra. Mariana Solís", // TODO
    role: "Psicóloga clínica — cédula profesional [TODO]",
    services: ["terapia-individual", "terapia-pareja", "terapia-familiar", "nutricion"],
    days: [1, 2, 3, 4, 5],
    open: 9,
    close: 17,
  },
  {
    id: "lic",
    name: "Lic. Jorge Aranda", // TODO
    role: "Terapeuta de masaje y medicina china",
    services: ["masaje-terapeutico", "medicina-china"],
    days: [1, 2, 3, 4, 5, 6],
    open: 9,
    close: 17,
    saturday: { open: 10, close: 14 },
  },
];

export const clinic = {
  name: "Raíz Viva", // TODO: nombre real
  fullName: "Raíz Viva · Clínica de Bienestar Integral",
  tagline: "Cuidado integral para tu cuerpo y tu mente, con un acompañamiento profesional y cercano.",
  city: "Ciudad de México",
  address: "Av. Insurgentes Sur 200, Col. Insurgencias, CDMX", // TODO
  whatsapp: "55 1234 5678", // TODO
  whatsappNumber: "525512345678", // TODO
  email: "contacto@raizviva.mx", // TODO
  hours: "Lunes a viernes 9:00–17:00 · Sábados 10:00–14:00",
  mapQuery: "Av. Insurgentes Sur 200, Ciudad de México",
  psychologist: {
    name: "Dra. Mariana Solís", // TODO
    role: "Psicóloga clínica",
    bio: "Psicóloga clínica con más de 10 años de experiencia en el acompañamiento de ansiedad, estrés y procesos de duelo. Combina la psicoterapia individual con un enfoque de bienestar integral que incluye hábitos, cuerpo y entorno.",
    education: [
      "Maestra en psicología clínica [TODO]",
      "Licenciada en psicología [TODO]",
      "Cédula profesional: [TODO]",
    ],
  },
  social: {
    instagram: "https://instagram.com/raizviva", // TODO
    facebook: "https://facebook.com/raizviva", // TODO
  },
};

// ==================== Recursos gratuitos ====================

export interface FreeResource {
  slug: string;
  title: string;
  category: string; // clave de resourceCategories
  minutes: number;
  level: "principiante" | "intermedio" | "avanzado";
  description: string;
  benefits: string[];
  cautions: string[];
  video?: { type: "youtube"; id: string }; // TODO: reemplazar por videos propios
  poster?: string; // url o /images/...
  relatedService?: string; // slug de servicio para CTA contextual
}

export const resourceCategories = [
  { key: "yoga", label: "Yoga" },
  { key: "meditacion", label: "Meditación" },
  { key: "respiracion", label: "Respiración" },
  { key: "estiramientos", label: "Estiramientos" },
  { key: "deporte", label: "Deporte" },
];

export const freeResources: FreeResource[] = [
  {
    slug: "yoga-suave",
    title: "Yoga suave para empezar",
    category: "yoga",
    minutes: 12,
    level: "principiante",
    description:
      "Una secuencia de movimientos lentos y accesibles para soltar la tensión del día. No necesitas experiencia ni equipo: una superficie cómoda es suficiente.",
    benefits: ["Suelta tensión en espalda y hombros", "Mejora la postura", "Ayuda a bajar la activación del cuerpo"],
    cautions: ["Si tienes alguna lesión o condición médica, consulta a tu médico antes de practicar.", "No empujes más allá de tu comodidad: el objetivo es sentir, no forzar."],
    video: undefined, // TODO: publicar video propio en /gratis
    relatedService: "masaje-terapeutico",
  },
  {
    slug: "respiracion-478",
    title: "Respiración 4-7-8 para dormir",
    category: "respiracion",
    minutes: 7,
    level: "principiante",
    description:
      "Técnica de respiración rítmica (4 segundos de inspiración, 7 de retención, 8 de exhalación) muy útil para activar la calma antes de dormir.",
    benefits: ["Favorece la relajación antes de dormir", "Entrena el control de la respiración", "Útil en momentos de ansiedad"],
    cautions: ["Si sientes mareo, acorta las retenciones.", "No sustituye el tratamiento de apnea u otras condiciones del sueño."],
    video: undefined, // TODO: publicar video propio en /gratis
    relatedService: "terapia-individual",
  },
  {
    slug: "meditacion-cuerpo",
    title: "Meditación guiada: atención al cuerpo",
    category: "meditacion",
    minutes: 15,
    level: "intermedio",
    description:
      "Un recorrido consciente por el cuerpo, de la cabeza a los pies, para observar sensaciones sin intentar cambiarlas. Ideal para empezar a entrenar la atención.",
    benefits: ["Entrena la atención plena", "Ayuda a reconocer señales de tensión", "Complementa el trabajo terapéutico"],
    cautions: ["Si la meditación activa recuerdos intensos, acorta la práctica o háblalo con tu terapeuta."],
    video: undefined, // TODO: publicar video propio en /gratis
    relatedService: "terapia-individual",
  },
  {
    slug: "estiramientos-cuello",
    title: "Estiramientos de cuello y hombros",
    category: "estiramientos",
    minutes: 8,
    level: "principiante",
    description:
      "Cuatro estiramientos simples para aliviar la tensión acumulada por el trabajo de computadora y el uso del teléfono. Se puede hacer en la silla.",
    benefits: ["Alivia la tensión de cuello y trapecios", "Mejora la movilidad de la zona cervical", "Se puede hacer en pausas del trabajo"],
    cautions: ["Si sientes hormigueo o dolor que se intensifica, detente y consulta a un profesional."],
    relatedService: "masaje-terapeutico",
  },
  {
    slug: "respiracion-diafragmatica",
    title: "Respiración diafragmática en 5 minutos",
    category: "respiracion",
    minutes: 6,
    level: "principiante",
    description:
      "La respiración abdominal es la base del sistema de calma del cuerpo. Aprende a sentir el diafragma y a usarla como herramienta diaria.",
    benefits: ["Activa el sistema nervioso paravaginal", "Disminuye la sensación de estrés", "Base para técnicas más avanzadas"],
    cautions: ["Practica con el estómago no completamente lleno."],
    relatedService: "medicina-china",
  },
  {
    slug: "yoga-espalda",
    title: "Yoga para la espalda",
    category: "yoga",
    minutes: 14,
    level: "intermedio",
    description:
      "Secuencia enfocada en fortalecer y movilizar la zona lumbar y dorsal, con posturas seguras y progresivas para días de mucho trabajo de pie o sentado.",
    benefits: ["Fortalece el core y la espalda", "Mejora la movilidad lumbar", "Previene molestias por postura"],
    cautions: ["Si tienes hernia discal o diagnóstico de espalda, consulta antes de practicar."],
    video: undefined, // TODO: publicar video propio en /gratis
    relatedService: "masaje-terapeutico",
  },
  {
    slug: "meditacion-gratitud",
    title: "Meditación de gratitud",
    category: "meditacion",
    minutes: 10,
    level: "principiante",
    description:
      "Una práctica breve para redirigir la atención hacia lo que sí funciona en tu vida. Útil como hábito diario o antes de dormir.",
    benefits: ["Mejora el estado de ánimo base", "Ayuda a contrarrestar el sesgo hacia lo negativo", "Fácil de mantener como hábito"],
    cautions: ["No es una técnica para crisis intensivas; acompáñala con el tratamiento si lo tienes."],
    relatedService: "terapia-pareja",
  },
  {
    slug: "caminata-consciente",
    title: "Caminata consciente de 20 minutos",
    category: "deporte",
    minutes: 9,
    level: "principiante",
    description:
      "Guía para convertir una caminata normal en una práctica de atención plena: atención a los pasos, el respirar y el entorno, sin apuros.",
    benefits: ["Ejercicio accesible de baja intensidad", "Entrena la atención plena", "Aporta movimiento a quien no hace deporte"],
    cautions: ["Camina en lugares seguros y con buena iluminación si es de noche."],
    relatedService: "nutricion",
  },
  {
    slug: "estiramientos-caderas",
    title: "Estiramientos de caderas",
    category: "estiramientos",
    minutes: 11,
    level: "intermedio",
    description:
      "Las caderas acumulan gran parte de la tensión de sentarse muchas horas. Esta secuencia trabaja el isquiotibial, el psoas y la zona glútea con seguridad.",
    benefits: ["Libera tensión pélvica y lumbar", "Mejora la flexibilidad de caderas", "Complementa la actividad física diaria"],
    cautions: ["Evita la presión si tienes lesiones de cadera o cirugía reciente."],
    relatedService: "masaje-terapeutico",
  },
  {
    slug: "respiracion-box",
    title: "Box breathing para enfocarte",
    category: "respiracion",
    minutes: 8,
    level: "avanzado",
    description:
      "Respiración cuadrada (4-4-4-4) usada para ganar control en momentos de alta demanda: antes de una presentación, un examen o una conversación difícil.",
    benefits: ["Da un ancla de control en momentos de presión", "Regula el ritmo de la respiración", "Se practica en cualquier lugar"],
    cautions: ["Si te mareas, reduce la retención a 2 segundos."],
    relatedService: "terapia-individual",
  },
];

// ==================== Artículos (blog) ====================

export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
}

export interface Article {
  slug: string;
  title: string;
  category: string; // clave de articleCategories
  tags: string[];
  author: string;
  date: string; // ISO
  video?: { type: "youtube"; id: string };
  excerpt: string;
  sections: ArticleSection[];
}

export const articleCategories = [
  { key: "psicologia", label: "Psicología" },
  { key: "medicina-china", label: "Medicina china" },
  { key: "masajes", label: "Masajes" },
  { key: "nutricion", label: "Nutrición" },
  { key: "salud-fisica", label: "Salud física" },
  { key: "salud-emocional", label: "Salud emocional" },
];

export const articles: Article[] = [
  {
    slug: "ansiedad-cuando-consultar",
    title: "Qué es la ansiedad y cuándo conviene consultar",
    category: "psicologia",
    tags: ["ansiedad", "estrés", "consulta"],
    author: "Dra. Mariana Solís", // TODO
    date: "2026-09-18",
    excerpt:
      "La ansiedad es una alarma del cuerpo: normal y útil en dosis pequeñas. El problema aparece cuando deja de apagarse.",
    sections: [
      {
        heading: "Una alarma que no se apaga",
        paragraphs: [
          "Sentir nervios antes de un examen, una plática difícil o una presentación es normal: el cuerpo se prepara para actuar. La ansiedad deja de ser útil cuando se activa sin motivo claro, se mantiene durante semanas y empieza a dominar las decisiones del día: evitar lugares, posponer decisiones, dormir mal.",
        ],
      },
      {
        heading: "Señales que valen la pena revisar",
        paragraphs: [
          "Si notas que la preocupación se volvió un fondo constante, que evitas cosas que antes hacías con tranquilidad, o que el cuerpo reacciona fuerte (taquicardia, tensión muscular, estómago sensible) casi todos los días, es un buen momento para una valoración profesional. No es un signo de debilidad: es el momento de pedir ayuda.",
          "Consultar pronto no cambia lo que viviste, pero cambia cuánto tiempo vas a seguir lidiando sin herramientas.",
        ],
      },
      {
        heading: "Qué esperar de la consulta",
        paragraphs: [
          "Una primera sesión es una conversación: cómo te sientes, qué te preocupa, cuánto tiempo llevas así y qué has intentado. No es un examen ni un dictamen. De ahí se acuerda, junto con el profesional, el siguiente paso: acompañamiento terapéutico, ajustes de hábitos, o derivación si corresponde.",
        ],
      },
    ],
  },
  {
    slug: "primera-sesion-terapia",
    title: "Tu primera sesión de terapia: qué esperar",
    category: "psicologia",
    tags: ["terapia", "primera sesión", "confianza"],
    author: "Dra. Mariana Solís", // TODO
    date: "2026-09-04",
    excerpt:
      "Muchas personas posponen la primera sesión por incertidumbre. Esto es lo que realmente sucede y por qué no necesitas tener la historia perfecta.",
    sections: [
      {
        heading: "Un espacio donde ser escuchada",
        paragraphs: [
          "La primera sesión no tiene un guion. El profesional te va a escuchar, hará preguntas sobre lo que te trae y te ayudará a ordenar lo que sientes. No te van a juzgar, ni te van a exigir llegar con respuestas claras. Llegar con un \"no sé qué pasa\" es un punto de partida válido.",
        ],
      },
      {
        heading: "Qué pasa después",
        paragraphs: [
          "Con lo que se conversa se acuerda un plan: qué quieren trabajar, con qué frecuencia y qué herramientas van a usarse. Algunas personas necesitan pocas sesiones (una crisis puntual), otras un acompañamiento más largo (patrones que se trabajan con el tiempo). Eso se ve con el tiempo, no se decide en el primer encuentro.",
        ],
      },
      {
        heading: "Convenios de confidencialidad",
        paragraphs: [
          "Todo lo que compartes es confidencial. La única excepción que vale la pena conocer es cuando hay riesgo de daño a ti o a otras personas: en ese caso el profesional tiene lineamientos claros de actuación. Es parte de la ética profesional, no un capricho.",
        ],
      },
    ],
  },
  {
    slug: "que-es-el-qi",
    title: "¿Qué es el Qi y cómo se manifiesta en el cuerpo?",
    category: "medicina-china",
    tags: ["acupuntura", "medicina china", "energía"],
    author: "Lic. Jorge Aranda", // TODO
    date: "2026-08-27",
    excerpt:
      "La medicina china no entiende el cuerpo como una suma de partes, sino como un flujo. El Qi es la palabra central de ese entendimiento.",
    sections: [
      {
        heading: "El concepto central",
        paragraphs: [
          "En la medicina tradicional china, el Qi (se lee \"chi\") es la energía vital que circula por el cuerpo por canales llamados meridianos. Cuando circula bien, hay movimiento, calor y función; cuando se bloquea o se debilita, aparece dolor, fatiga o desequilibrio.",
        ],
      },
      {
        heading: "Cómo se manifiesta en el día a día",
        paragraphs: [
          "Lo que la clínica observa no es el Qi en abstracto, sino sus señales: tensión muscular en un punto específico, frío o calor en ciertas zonas, cambios en el pulso, en la lengua, en el sueño o en la digestión. La evaluación inicial (pulso, lengua y historial) sirve para leer esas señales y decidir dónde trabajar.",
        ],
      },
      {
        heading: "Qué se hace en una sesión",
        paragraphs: [
          "Según la evaluación, se aplican agujas finas en puntos específicos de los meridianos, o se usa electroacupuntura (TENS) para potenciar el estímulo. El objetivo es restaurar el flujo: muchas personas reportan alivio de tensión y mejora del descanso después de las primeras sesiones.",
          "Importante: la acupuntura es una práctica complementaria. No sustituye la valoración médica cuando hay una condición que requiere atención específica.",
        ],
      },
    ],
  },
  {
    slug: "masaje-terapeutico-beneficios",
    title: "Masaje terapéutico: más allá de la relajación",
    category: "masajes",
    tags: ["masaje", "tensión", "dolor"],
    author: "Lic. Jorge Aranda", // TODO
    date: "2026-08-12",
    excerpt:
      "El masaje terapéutico no es un lujo: es una herramienta para el manejo de tensión y dolor muscular, con evidencia de beneficios cuando se aplica de forma profesional.",
    sections: [
      {
        heading: "Qué es un masaje terapéutico",
        paragraphs: [
          "A diferencia del masaje de relajación general, el terapéutico parte de una evaluación: dónde hay tensión, qué la provoca y qué técnica conviene (compresión, fricción, trabajo sobre tejido profundo). Por eso no son iguales para todo el mundo.",
        ],
      },
      {
        heading: "Beneficios con respaldo",
        paragraphs: [
          "La evidencia muestra que el masaje terapéutico puede reducir el dolor musculoesquelético, mejorar la amplitud de movimiento y bajar la tensión percibida. En personas con dolor de cuello o espalda baja, suele usarse junto con ejercicios y ajustes posturales, no como única solución.",
          "El efecto no es mágico: funciona porque el trabajo manual reduce la activación muscular sostenida y mejora la circulación local, y también porque la pausa y la atención que implica activan mecanismos de calmamiento del sistema nervioso.",
        ],
      },
      {
        heading: "Quién debe tener cuidado",
        paragraphs: [
          "Hay contraindicaciones: lesiones recientes, procesos infecciosos, problemas circulatorios severos o trastornos de coagulación. Por eso la primera sesión incluye una breve evaluación y preguntas de salud. Si tienes una condición médica, coméntala antes de agendar.",
        ],
      },
    ],
  },
  {
    slug: "nutricion-y-animo",
    title: "Nutrición y ánimo: lo que dice la evidencia",
    category: "nutricion",
    tags: ["nutrición", "ánimo", "hábitos"],
    author: "Dra. Mariana Solís", // TODO
    date: "2026-07-30",
    excerpt:
      "Lo que comemos influye en cómo nos sentimos. No es la única pieza, pero es una que muchas personas descuidan.",
    sections: [
      {
        heading: "Intestino y cerebro",
        paragraphs: [
          "Una parte creciente de la investigación apunta a una conexión bidireccional entre el intestino y el cerebro: la microbiota produce sustancias que influyen en el estado de ánimo, y el estrés afecta la digestión. Por eso muchas personas que trabajan su ánimo notan mejoras cuando ordenan también la comida.",
        ],
      },
      {
        heading: "Lo que la investigación sugiere",
        paragraphs: [
          "No existe una \"comida feliz\", pero sí patrones consistentes: dietas con variedad, proteína suficiente, grasas saludables y pocos ultraprocesados se asocian con mejor estado de ánimo y más energía. Lo contrario (saltarse comidas, exceso de azúcares y ultraprocesados) se asocia con más fatiga y variaciones de ánimo.",
          "La clave no es la perfección: son ajustes sostenibles. Un cambio de tres hábitos mantiene más que una dieta perfecta de dos semanas.",
        ],
      },
      {
        heading: "Por dónde empezar",
        paragraphs: [
          "Si quieres trabajar tu relación con la comida y tu energía, un acompañamiento nutricional ayuda a encontrar los cambios que funcionen para ti, sin dietas punitivas ni listas de prohibidos. Y si el ánimo está muy afectado, la terapia y el acompañamiento nutricional trabajan mejor juntos.",
        ],
      },
    ],
  },
  {
    slug: "respiracion-diafragmatica",
    title: "Respiración diafragmática en 5 minutos",
    category: "salud-fisica",
    tags: ["respiración", "estrés", "hábitos"],
    author: "Dra. Mariana Solís", // TODO
    date: "2026-07-15",
    excerpt:
      "La mayoría de las personas respira con el pecho, de forma superficial. La respiración diafragmática es el punto de entrada más simple para activar la calma.",
    sections: [
      {
        heading: "Por qué calma",
        paragraphs: [
          "Al respirar lento y profundo se activa el sistema nervioso paravaginal, el lado del \"frenar y reparar\": baja la frecuencia cardiaca, se libera la tensión de hombros y mandíbula, y disminuye la sensación de urgencia. No requiere ningún equipo y se puede hacer prácticamente en cualquier lugar.",
        ],
      },
      {
        heading: "Paso a paso",
        paragraphs: [
          "Siéntate o acuéstate con la espalda apoyada. Coloca una mano en el pecho y otra en el abdomen. Inhala por la nariz contando hasta 4, sintiendo cómo el abdomen se eleva (el pecho casi no se mueve). Exhala por la boca contando hasta 6, dejando salir todo el aire. Repite 8–10 ciclos.",
          "Cin minutos diarios, dos veces al día, es un hábito realista. Muchas personas lo integran antes de dormir o antes de una conversación difícil.",
        ],
      },
      {
        heading: "Cuándo usarla",
        paragraphs: [
          "Es una herramienta de apoyo, no un tratamiento: funciona muy bien como complemento de la terapia o del acompañamiento médico. Si la ansiedad es intensa o persistente, conviene acompañar la práctica con una consulta profesional.",
        ],
      },
    ],
  },
  {
    slug: "dormir-bien",
    title: "Dormir bien: hábitos que realmente funcionan",
    category: "salud-emocional",
    tags: ["sueño", "hábitos", "estrés"],
    author: "Dra. Mariana Solís", // TODO
    date: "2026-06-20",
    excerpt:
      "El sueño es la base del estado de ánimo. Estas son las cinco estrategias con mejor evidencia y que casi todo el mundo puede implementar.",
    sections: [
      {
        heading: "Por qué importa tanto",
        paragraphs: [
          "Dormir poco no es solo cansancio: afecta la regulación emocional (se reacciona más fuerte), la memoria, el apetito y el sistema inmune. Muchos cuadros de ansiedad y baja de ánimo empeoran primero por el sueño y luego por todo lo demás.",
        ],
      },
      {
        heading: "Cinco cambios con evidencia",
        paragraphs: [
          "1) Horario constante: levantarse a la misma hora todos los días (incluyendo fines de semana) es la señal más potente para el reloj biológico. 2) Luz: exposición a luz natural por la mañana y luz baja (y sin pantallas o con filtro) en las dos horas antes de dormir. 3) Pantallas: alejarlas de la cama; el cerebro las asocia con vigilia. 4) Cuna como refugio: la cama para dormir e intimidad, no para trabajar o ver series. 5) Rutina de apagado: 30 minutos antes de dormir, una actividad tranquila y repetible (lectura suave, respiración, estiramientos).",
        ],
      },
      {
        heading: "Cuando el insomnio se vuelve señal",
        paragraphs: [
          "Si la dificultad para dormir dura más de dos a tres semanas y afecta el resto de la vida (trabajo, ánimo, relaciones), vale una consulta: detrás del insomnio a veces hay ansiedad, depresión o apnea que conviene diagnosticar.",
        ],
      },
    ],
  },
  {
    slug: "estiramientos-cuello-espalda",
    title: "Estiramientos básicos para la tensión de cuello y espalda",
    category: "salud-fisica",
    tags: ["estiramientos", "postura", "tensión"],
    author: "Lic. Jorge Aranda", // TODO
    date: "2026-06-05",
    excerpt:
      "Cuatro estiramientos seguros que puedes hacer en tu silla, en cinco minutos, para aliviar la tensión que se acumula con el trabajo de pantalla.",
    sections: [
      {
        heading: "Por qué se acumula",
        paragraphs: [
          "Trabajar varias horas con la cabeza adelantada sobre la pantalla multiplica la carga sobre el cuello: cada centímetro de cabeza adelantada agrega peso que los trapecios y el cuello deben sostener. De ahí la sensación de cuello duro a media tarde.",
        ],
      },
      {
        heading: "Cuatro estiramientos seguros",
        paragraphs: [
          "1) Rotación lenta de cuello: gira la cabeza hacia cada lado, sosteniendo 15 segundos sin forzar. 2) Inclinación lateral: oído hacia el hombro, mano apoyando suavemente, 15 segundos por lado. 3) Pálpalo de trapecio: con la mano del lado opuesto, presiona suavemente la parte alta del trapecio y exhala. 4) Puerta: pasa un brazo por una puerta (o marco) a la altura del hombro y deja que la cadera avance suavemente para estirar el dorsal y el hombro.",
          "Haz cada uno 2–3 veces al día, sin rebotar y con respiración lenta. Si sientes hormigueo o dolor agudo, detente.",
        ],
      },
      {
        heading: "Cuándo buscar apoyo",
        paragraphs: [
          "Si la tensión se mantiene varias semanas a pesar de los estiramientos, o si hay dolor que irradia al brazo, es momento de una valoración con un profesional de terapia física o masaje.",
        ],
      },
    ],
  },
];

// ==================== Cursos ====================

export interface Course {
  slug: string;
  title: string;
  theme: string; // clave de courseThemes
  modality: "presencial" | "enlinea" | "grabado";
  weeks: number;
  schedule: string;
  instructor: string; // TODO
  price: string; // TODO
  seats: string; // TODO
  requirements: string[];
  syllabus: string[];
  description: string;
  forWho: string;
}

export const courseThemes = [
  { key: "yoga", label: "Yoga" },
  { key: "masaje", label: "Masaje" },
  { key: "medicina-china", label: "Medicina china" },
  { key: "nutricion", label: "Nutrición" },
];

export const courses: Course[] = [
  {
    slug: "yoga-gestion-estres",
    title: "Yoga para la gestión del estrés",
    theme: "yoga",
    modality: "enlinea",
    weeks: 4,
    schedule: "Martes y jueves, 19:00 (video en vivo + grabaciones)",
    instructor: "Dra. Mariana Solís", // TODO
    price: "TODO: confirmar precio",
    seats: "TODO: confirmar cupo",
    requirements: ["No se requiere experiencia", "Un espacio de 2 × 2 m", "Videoconferencia funcional"],
    syllabus: [
      "Semanas 1–2: base de respiración, postura y secuencias de baja intensidad",
      "Semanas 3–4: secuencias para el día de trabajo, hábitos y cierre",
    ],
    description:
      "Un curso práctico de 4 semanas para aprender a usar el yoga como herramienta de regulación del estrés: respiración, movimientos suaves y hábitos diarios.",
    forWho: "Personas con niveles altos de estrés que quieren herramientas prácticas, sin experiencia previa en yoga.",
  },
  {
    slug: "fundamentos-masaje",
    title: "Fundamentos de masaje terapéutico",
    theme: "masaje",
    modality: "presencial",
    weeks: 8,
    schedule: "Sábados, 10:00–14:00",
    instructor: "Lic. Jorge Aranda", // TODO
    price: "TODO: confirmar precio",
    seats: "TODO: confirmar cupo",
    requirements: ["No se requiere experiencia", "Compromiso de asistencia (75 %)", "Material básico (se proporcionan lista y guía)"],
    syllabus: [
      "Semanas 1–2: anatomía funcional, higiene, postura del terapeuta",
      "Semanas 3–4: técnicas básicas de maniobras y secuencias",
      "Semanas 5–6: evaluación de tensión y adaptación del masaje",
      "Semanas 7–8: práctica supervisada y protocolos completos",
    ],
    description:
      "Formación presencial de 8 semanas para quienes quieren aprender masaje terapéutico desde la base: anatomía, técnica y evaluación, con práctica supervisada.",
    forWho: "Personas interesadas en una carrera o complemento profesional en terapia manual, sin necesidad de experiencia previa.",
  },
  {
    slug: "nutricion-equilibrio",
    title: "Nutrición para el equilibrio emocional",
    theme: "nutricion",
    modality: "enlinea",
    weeks: 4,
    schedule: "Lunes, 19:00 (video en vivo + grabaciones)",
    instructor: "Dra. Mariana Solís", // TODO
    price: "TODO: confirmar precio",
    seats: "TODO: confirmar cupo",
    requirements: ["Videoconferencia funcional", "Voluntad de aplicar cambios gradualmente"],
    syllabus: [
      "Semana 1: cómo influye la comida en el ánimo (evidencia)",
      "Semana 2: lectura de hábitos y patrones personales",
      "Semana 3: ajustes prácticos (compras, preparación, horarios)",
      "Semana 4: mantenimiento y manejo de recaídas",
    ],
    description:
      "Curso de 4 semanas para entender la relación entre alimentación y estado de ánimo, y aplicar ajustes sostenibles sin dietas punitivas.",
    forWho: "Personas que quieren mejorar su energía y su relación con la comida, y que buscan cambios realistas y duraderos.",
  },
  {
    slug: "qigong-energia-diaria",
    title: "Qigong para la energía diaria",
    theme: "medicina-china",
    modality: "presencial",
    weeks: 4,
    schedule: "Miércoles, 18:00–19:00",
    instructor: "Lic. Jorge Aranda", // TODO
    price: "TODO: confirmar precio",
    seats: "TODO: confirmar cupo",
    requirements: ["Ropa cómoda", "No se requiere experiencia"],
    syllabus: [
      "Semana 1: postura, respiración y los movimientos base",
      "Semana 2: secuencias de apertura y cierre",
      "Semana 3: secuencia completa de 20 minutos",
      "Semana 4: personalización y práctica autónoma",
    ],
    description:
      "Secuencias de qigong (movimiento + respiración consciente) para ganar energía y estabilidad durante el día, con fundamentos de medicina china explicados de forma sencilla.",
    forWho: "Personas de todas las edades que buscan una práctica de movimiento suave y consciente, y quieren entender su base en la medicina tradicional china.",
  },
];

// ==================== Testimonios ====================

export interface Testimonial {
  name: string; // TODO
  context: string; // TODO
  text: string; // TODO
}

// TODO: reemplazar con testimonios reales y con consentimiento escrito
export const testimonials: Testimonial[] = [
  { name: "TODO: nombre", context: "TODO: contexto (ej. terapia individual)", text: "TODO: testimonial con consentimiento de la persona." },
  { name: "TODO: nombre", context: "TODO: contexto (ej. curso de masaje)", text: "TODO: testimonial con consentimiento de la persona." },
  { name: "TODO: nombre", context: "TODO: contexto (ej. masajes terapéuticos)", text: "TODO: testimonial con consentimiento de la persona." },
];

// ==================== Navegación y enlaces ====================

export const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Gratis", href: "/gratis" },
  { label: "Aprende", href: "/aprende" },
  { label: "Servicios", href: "/servicios" },
  { label: "Cursos", href: "/cursos" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
];

export const linkInBio = [
  { label: "Agendar una cita", href: "/agendar", primary: true },
  { label: "Contenido gratis", href: "/gratis" },
  { label: "Servicios y terapias", href: "/servicios" },
  { label: "Cursos y talleres", href: "/cursos" },
  { label: "Aprende con nosotros", href: "/aprende" },
  { label: "Escríbenos por WhatsApp", href: `https://wa.me/${clinic.whatsappNumber}` }, // TODO
  { label: "Ubicación", href: "/contacto#mapa" },
];

