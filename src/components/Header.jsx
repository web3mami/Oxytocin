export default function Header({ spotsLeft, teamCount }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <a className="brand" href="#top">
          <span className="brand__mark" aria-hidden="true" />
          <span>
            <strong>Oxytocin</strong>
            <small>CODM Cup</small>
          </span>
        </a>
        <nav className="header__nav">
          <a href="#info">Info</a>
          <a href="#register">Register</a>
          <a href="#teams">Teams ({teamCount})</a>
        </nav>
        <div className="header__badge" aria-label={`${spotsLeft} spots remaining`}>
          {spotsLeft} slots left
        </div>
      </div>
    </header>
  );
}
