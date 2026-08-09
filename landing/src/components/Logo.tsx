// ============================================================
// Veterinaria La Plata — Logo SVG (Web version)
// ============================================================
import logoImg from '../assets/images/Logo.png';

export const Logo = ({ className = '', size = 48 }: { className?: string; size?: number }) => (
  <img
    src={logoImg}
    alt="Veterinaria La Plata Logo"
    width={size}
    height={size}
    className={`object-contain ${className}`}
  />
);

export const LogoFull = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <Logo size={48} />
    <div>
      <div className="text-sm font-bold tracking-wider text-text-dark font-quicksand uppercase">Veterinaria</div>
      <div className="text-xl font-bold text-primary font-quicksand -mt-1">La Plata</div>
    </div>
  </div>
);
