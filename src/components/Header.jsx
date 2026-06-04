export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <a className="brand" href="#top">
          <img src="/emblem.svg" alt="Oxytocin Tournament" className="brand__mark" />
          <span>
            <strong>Oxytocin</strong>
            <small>Tournament</small>
          </span>
        </a>
        <nav className="header__nav">
          <a href="#info">Info</a>
          <a href="/roster">Battle roster</a>
          <a href="#register">Register</a>
        </nav>
      </div>
    </header>
  );
}
