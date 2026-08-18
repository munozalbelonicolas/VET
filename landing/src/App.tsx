// ============================================================
// Veterinaria La Plata — Landing Page App
// ============================================================
import { useState, useEffect } from 'react';
import { LogoFull, Logo } from './components/Logo';
import vetHeroImg from './assets/images/vet_hero.png';
import vetClinicImg from './assets/images/vet_clinic.png';
import gallery1 from './assets/images/gallery_1.png';
import gallery2 from './assets/images/gallery_2.png';
import gallery3 from './assets/images/gallery_3.png';
import gallery4 from './assets/images/gallery_4.png';
import gallery5 from './assets/images/gallery_5.png';
import gallery6 from './assets/images/gallery_6.png';

// ============================================================
// Navbar
// ============================================================
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { href: '#servicios', label: 'Servicios' },
    { href: '#nosotros', label: 'Nosotros' },
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#testimonios', label: 'Testimonios' },
    { href: '#faq', label: 'FAQ' },
    { href: '#contacto', label: 'Contacto' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 min-h-[80px]">
          <LogoFull />

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {links.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-text-muted hover:text-primary transition-colors font-nunito"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#descargar"
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 font-nunito"
            >
              Descargar App
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-primary-soft transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D3436" strokeWidth="2">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {links.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2 text-text-dark font-semibold hover:text-primary transition-colors font-nunito"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#descargar"
              className="block text-center bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all font-nunito"
            >
              Descargar App
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

// ============================================================
// Hero Section
// ============================================================
function Hero() {
  return (
    <section id="descargar" className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-primary-soft text-primary-dark px-4 py-2 rounded-full text-sm font-bold mb-6 font-nunito">
              🐾 Tu veterinaria de confianza
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-dark leading-tight mb-6 font-quicksand">
              El cuidado que tu{' '}
              <span className="text-primary relative">
                mascota
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2,8 Q50,2 100,8 T200,6" stroke="#FF8C42" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
                </svg>
              </span>{' '}
              merece
            </h1>

            <p className="text-lg md:text-xl text-text-muted mb-8 max-w-xl mx-auto lg:mx-0 font-nunito leading-relaxed">
              Pedí turnos, llevá el historial clínico y comprá todo lo que tu mascota necesita. Todo desde una sola app.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* App Store button */}
              <a href="#" className="inline-flex items-center justify-center gap-3 bg-text-dark text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all hover:shadow-xl group">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-75">Descargá en</div>
                  <div className="text-lg font-bold -mt-1">App Store</div>
                </div>
              </a>

              {/* Google Play button */}
              <a href="#" className="inline-flex items-center justify-center gap-3 bg-text-dark text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all hover:shadow-xl group">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-75">Disponible en</div>
                  <div className="text-lg font-bold -mt-1">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="flex-1 flex justify-center animate-fade-in-up delay-300">
            <div className="relative">
              <div className="w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-primary-soft to-accent-soft rounded-full flex items-center justify-center animate-float overflow-hidden shadow-2xl">
                <img src={vetHeroImg} alt="Veterinaria La Plata" className="w-full h-full object-cover" />
              </div>
              {/* Floating badges */}
              <div className="absolute top-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3 animate-bounce-gentle">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏥</span>
                  <div>
                    <div className="text-xs text-text-muted font-nunito">Turnos online</div>
                    <div className="text-sm font-bold text-text-dark font-nunito">24/7</div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-8 -right-4 bg-white rounded-2xl shadow-xl px-4 py-3 animate-bounce-gentle delay-500">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💊</span>
                  <div>
                    <div className="text-xs text-text-muted font-nunito">Vacunas</div>
                    <div className="text-sm font-bold text-success font-nunito">Al día ✓</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 left-8 bg-white rounded-2xl shadow-xl px-4 py-3 animate-bounce-gentle delay-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛒</span>
                  <div>
                    <div className="text-xs text-text-muted font-nunito">Petshop</div>
                    <div className="text-sm font-bold text-accent font-nunito">Envío gratis</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Services Section
// ============================================================
function Services() {
  const services = [
    { icon: '🩺', title: 'Consultas', desc: 'Diagnóstico y tratamiento integral para tu mascota con profesionales de confianza.', color: 'bg-primary-soft text-primary-dark' },
    { icon: '💉', title: 'Vacunación', desc: 'Calendario de vacunas completo. Recordatorios automáticos para que no te olvides.', color: 'bg-green-50 text-green-700' },
    { icon: '✂️', title: 'Peluquería', desc: 'Baño, corte, deslanado y tratamientos estéticos. Tu mascota siempre hermosa.', color: 'bg-accent-soft text-accent-dark' },
    { icon: '🏥', title: 'Castración', desc: 'Cirugías seguras con seguimiento post-operatorio incluido.', color: 'bg-blue-50 text-blue-700' },
    { icon: '🚨', title: 'Urgencias', desc: 'Atención de urgencias durante el horario de atención. Tu mascota en buenas manos.', color: 'bg-red-50 text-red-700' },
    { icon: '🛒', title: 'Petshop Online', desc: 'Alimentos, accesorios, medicamentos y más. Comprá desde la app y recibí en casa.', color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <section id="servicios" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary-soft text-primary-dark px-4 py-2 rounded-full text-sm font-bold mb-4 font-nunito">
            Nuestros servicios
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4 font-quicksand">
            Todo lo que tu mascota necesita
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto font-nunito">
            Ofrecemos atención integral para perros y gatos. Desde consultas médicas hasta peluquería y petshop online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl bg-bg-main border border-transparent hover:border-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className={`w-16 h-16 rounded-2xl ${service.color} flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform`}>
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-3 font-quicksand">{service.title}</h3>
              <p className="text-text-muted leading-relaxed font-nunito">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// About Section
// ============================================================
function About() {
  return (
    <section id="nosotros" className="py-20 md:py-28 bg-bg-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Image placeholder */}
          <div className="flex-1">
            <div className="relative">
              <div className="w-full aspect-square max-w-lg mx-auto bg-gradient-to-br from-primary-soft via-white to-accent-soft rounded-3xl flex items-center justify-center overflow-hidden shadow-xl">
                <img src={vetClinicImg} alt="Nuestro consultorio" className="w-full h-full object-cover" />
              </div>
              {/* Accent shapes */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full" />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-accent-soft text-accent-dark px-4 py-2 rounded-full text-sm font-bold mb-4 font-nunito">
              Sobre nosotros
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-6 font-quicksand">
              Tu veterinaria de barrio, con tecnología de primer nivel
            </h2>
            <p className="text-text-muted text-lg leading-relaxed mb-6 font-nunito">
              Somos un equipo de profesionales apasionados por el bienestar animal. Desde 2015 atendemos a las mascotas del barrio con dedicación, cariño y profesionalismo.
            </p>
            <p className="text-text-muted text-lg leading-relaxed mb-8 font-nunito">
              Creemos que la tecnología puede mejorar la experiencia de cuidar a tu mascota. Por eso creamos nuestra app: para que puedas llevar el historial clínico, pedir turnos y comprar todo lo que necesitás, desde tu celular.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { number: '+2000', label: 'Mascotas atendidas' },
                { number: '10', label: 'Años de experiencia' },
                { number: '4.9⭐', label: 'Calificación Google' },
                { number: '5', label: 'Profesionales' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 bg-white rounded-2xl shadow-sm">
                  <div className="text-2xl font-bold text-primary font-quicksand">{stat.number}</div>
                  <div className="text-sm text-text-muted font-nunito mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// How It Works
// ============================================================
function HowItWorks() {
  const steps = [
    { num: '1', icon: '📲', title: 'Descargá la app', desc: 'Disponible en App Store y Google Play. Registrate en segundos.' },
    { num: '2', icon: '🐾', title: 'Registrá tu mascota', desc: 'Cargá los datos de tu perro o gato y su historial médico.' },
    { num: '3', icon: '📅', title: 'Pedí turno', desc: 'Elegí el servicio, el día y el horario. Confirmación inmediata.' },
    { num: '4', icon: '✅', title: '¡Listo!', desc: 'Recibí recordatorios y llevá el control de la salud de tu mascota.' },
  ];

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary-soft text-primary-dark px-4 py-2 rounded-full text-sm font-bold mb-4 font-nunito">
            Cómo funciona
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4 font-quicksand">
            Cuidar a tu mascota nunca fue tan fácil
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto font-nunito">
            En 4 simples pasos empezá a usar la app y olvidate de las complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
              )}

              <div className="relative z-10 w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center text-4xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>

              <div className="absolute top-0 right-1/4 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold z-20 font-nunito">
                {step.num}
              </div>

              <h3 className="text-lg font-bold text-text-dark mb-2 font-quicksand">{step.title}</h3>
              <p className="text-text-muted font-nunito">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Testimonials
// ============================================================
const TESTIMONIALS = [
  { name: 'María González', pet: 'Luna 🐕', text: 'Increíble poder llevar el historial de Luna en el celular. Los recordatorios de vacunas me salvaron más de una vez. ¡La mejor veterinaria de La Plata!', rating: 5 },
  { name: 'Carlos Rodríguez', pet: 'Michi 🐈', text: 'El Dr. Fernández es un genio. La app es súper práctica para pedir turnos y comprar la comida de Michi sin salir de casa.', rating: 5 },
  { name: 'Ana Martínez', pet: 'Rocky 🐕', text: 'Rocky sale hermoso de la peluquería cada vez. La app me recuerda cuándo toca el próximo baño. Súper recomendable.', rating: 5 },
  { name: 'Lucía Fernández', pet: 'Nina 🐈', text: 'Me encanta poder ver el peso de Nina mes a mes y que la vet me mande recordatorios. La castración salió perfecto, excelente seguimiento.', rating: 5 },
];

function Testimonials() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="testimonios" className="py-20 md:py-28 bg-bg-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent-soft text-accent-dark px-4 py-2 rounded-full text-sm font-bold mb-4 font-nunito">
            ⭐ Testimonios
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4 font-quicksand">
            Lo que dicen nuestros clientes
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
            {/* Quote decoration */}
            <div className="absolute top-6 left-8 text-8xl text-primary/10 font-serif">"</div>

            <div className="relative z-10">
              <div className="flex gap-1 mb-6">
                {Array.from({ length: TESTIMONIALS[current].rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>

              <p className="text-lg md:text-xl text-text-dark leading-relaxed mb-8 font-nunito italic">
                "{TESTIMONIALS[current].text}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xl font-bold font-nunito">
                  {TESTIMONIALS[current].name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-text-dark font-quicksand">{TESTIMONIALS[current].name}</div>
                  <div className="text-text-muted font-nunito">Dueña de {TESTIMONIALS[current].pet}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-primary' : 'w-2.5 bg-primary/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Gallery
// ============================================================
function Gallery() {
  const images = [
    { src: gallery1, caption: 'Consulta veterinaria' },
    { src: gallery2, caption: 'Vacunación' },
    { src: gallery3, caption: 'Peluquería' },
    { src: gallery4, caption: 'Nuestro consultorio' },
    { src: gallery5, caption: 'Pacientes felices' },
    { src: gallery6, caption: 'Farmacia veterinaria' },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4 font-quicksand">
            Galería 📸
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto font-nunito">
            Conocé nuestras instalaciones y algunos de nuestros pacientes más queridos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="group relative aspect-square bg-gradient-to-br from-primary-soft to-accent-soft rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <img src={img.src} alt={img.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-end">
                  <span className="text-sm font-semibold text-white font-nunito">{img.caption}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FAQ Section
// ============================================================
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: '¿Cómo pido un turno desde la app?', a: 'Descargá la app, registrate, agregá tu mascota y elegí el servicio que necesitás. Seleccioná el día y horario disponible, ¡y listo! Vas a recibir confirmación inmediata y recordatorios antes del turno.' },
    { q: '¿Atienden urgencias?', a: 'Sí, atendemos urgencias dentro de nuestro horario de atención (lunes a viernes de 9 a 19hs, sábados de 9 a 13hs). Fuera de horario, te recomendamos contactar al servicio de emergencias veterinarias más cercano.' },
    { q: '¿Hacen envíos del petshop?', a: 'Sí, hacemos envíos dentro de La Plata y alrededores. Podés seguir el estado de tu pedido en tiempo real desde la app. El envío es gratis para compras mayores a $15.000.' },
    { q: '¿Puedo ver el historial clínico de mi mascota?', a: 'Sí, desde la app tenés acceso completo al historial clínico: vacunas, consultas, tratamientos, estudios y evolución de peso. Todo en un solo lugar.' },
    { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos Mercado Pago (tarjetas de crédito y débito) y transferencia bancaria. En el local también aceptamos efectivo.' },
    { q: '¿La app es gratuita?', a: '¡Sí! La app es 100% gratuita para todos los clientes de la veterinaria. Descargala desde App Store o Google Play.' },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-bg-main">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary-soft text-primary-dark px-4 py-2 rounded-full text-sm font-bold mb-4 font-nunito">
            ❓ Preguntas frecuentes
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4 font-quicksand">
            ¿Tenés dudas?
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-text-dark font-quicksand pr-4">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 text-text-muted leading-relaxed font-nunito">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Footer
// ============================================================
function Footer() {
  return (
    <footer id="contacto" className="bg-text-dark text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3.5 mb-6">
              <Logo size={60} />
              <div>
                <div className="text-xs font-bold tracking-wider uppercase opacity-70">Veterinaria</div>
                <div className="text-lg font-bold text-primary font-quicksand">La Plata</div>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed font-nunito text-sm">
              Tu veterinaria de barrio con tecnología de primer nivel. Cuidamos a tu mascota como si fuera nuestra.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 font-quicksand">Contacto</h4>
            <div className="space-y-3 text-gray-400 text-sm font-nunito">
              <p>📍 Calle 7 N° 1234, La Plata</p>
              <p>📞 (0221) 555-0100</p>
              <p>📧 info@veterinarialaplata.com</p>
              <a
                href="https://maps.google.com/?q=La+Plata+Buenos+Aires"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:text-primary-light transition-colors"
              >
                📍 Ver en Google Maps →
              </a>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-bold mb-4 font-quicksand">Horarios</h4>
            <div className="space-y-2 text-gray-400 text-sm font-nunito">
              <p>Lunes a Viernes: 9:00 - 19:00</p>
              <p>Sábados: 9:00 - 13:00</p>
              <p>Domingos: Cerrado</p>
              <p className="text-accent font-semibold mt-2">🚨 Urgencias en horario de atención</p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold mb-4 font-quicksand">Seguinos</h4>
            <div className="flex gap-3 mb-6">
              {[
                { label: 'IG', href: '#' },
                { label: 'FB', href: '#' },
                { label: 'TT', href: '#' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-primary transition-colors text-sm font-bold"
                >
                  {social.label}
                </a>
              ))}
            </div>
            <a
              href="#descargar"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-all font-nunito"
            >
              📲 Descargá la app
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 font-nunito">
          <p>© {new Date().getFullYear()} Veterinaria La Plata. Todos los derechos reservados.</p>
          <p className="mt-2 md:mt-0">Hecho con 🐾 para las mascotas de La Plata</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// WhatsApp Button
// ============================================================
function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5492215550100?text=Hola!%20Quiero%20consultar%20por%20un%20turno"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-xl hover:bg-green-600 transition-all hover:scale-110 animate-pulse-glow"
      aria-label="Contactar por WhatsApp"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  );
}

// ============================================================
// Main App
// ============================================================
export default function App() {
  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar />
      <Hero />
      <Services />
      <About />
      <HowItWorks />
      <Testimonials />
      <Gallery />
      <FAQ />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
