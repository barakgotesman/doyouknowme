/**
 * Hero section at the top of the lobby — game logo, title, and tagline.
 * Purely presentational.
 */
export default function Hero() {
  return (
    <div className="flex flex-col items-center gap-3 text-center max-w-2xl">
      <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl overflow-hidden shadow-xl">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5UAANrg2DkcYlsLZYNmgZbbvWAOASTXGFdTMfwqdVhupouBUV-UJkYQe4shrK-c6hxlOF17SDSk3OXlbFlEP74vM8XAFh7wEfetSSnEeUNxIoZGj_9hmHrBCrwJ76wrCgK0QNIHaB1wQnZqXm-N5o9M9kepR9M9Rms6oVqd9noev7FV7Uxp1C4sPTIoBCgNX_thRN_Ve-EPTfQCPwBEcNbcb4xbi8MmWguXR3P1gd0ZIf5c8Vc0oMAOnMIn_P-WoO1uvhhfsSQaY"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface">מכירים אותי?</h1>
      <p className="text-sm md:text-base font-medium text-on-surface-variant max-w-md">
        בדקו כמה אתם באמת מכירים את החברים שלכם! ענו על שאלות, נחשו תשובות וגלו מי מכיר את מי.
      </p>
    </div>
  )
}
