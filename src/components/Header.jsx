export default function Header({ spotsLeft }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <a className="brand" href="#top">
          <img src="/emblem.svg" alt="Oxytocin Cup" className="brand__mark" />
          <span>
            <strong>Oxytocin</strong>
            <small>CODM Cup</small>
          </span>
        </a>
        <nav className="header__nav">
          <a href="#info">Info</a>
          <a href="#register">Register</a>
        </nav>
        <div className="header__badge" aria-label={`${spotsLeft} spots remaining`}>
          {spotsLeft} slots left
        </div>
      </div>
    </header>
  );
}
