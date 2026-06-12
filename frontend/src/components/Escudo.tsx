export default function Escudo({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Escudo de la facultad"
    >
      {/* Escudo */}
      <path
        d="M32 3 56 11V31C56 46 45 56 32 61 19 56 8 46 8 31V11L32 3Z"
        fill="#14213d"
        stroke="#c5a253"
        strokeWidth="2.5"
      />
      {/* Cinta superior */}
      <path d="M8 22H56V26H8V22Z" fill="#c5a253" opacity="0.9" />
      {/* Libro abierto */}
      <path
        d="M32 33C28 30 23 30 19 31V44C23 43 28 43 32 46V33Z"
        fill="#f5f6f8"
      />
      <path
        d="M32 33C36 30 41 30 45 31V44C41 43 36 43 32 46V33Z"
        fill="#e7eaf0"
      />
      <path d="M32 33V46" stroke="#14213d" strokeWidth="1.5" />
      {/* Estrella */}
      <path
        d="M32 8L33.6 12.2L38 12.4L34.6 15.2L35.8 19.5L32 17L28.2 19.5L29.4 15.2L26 12.4L30.4 12.2L32 8Z"
        fill="#c5a253"
      />
    </svg>
  );
}
