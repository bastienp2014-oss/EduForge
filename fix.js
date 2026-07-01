import fs from 'fs';
const files = [
  'src/components/HomeScreen.tsx',
  'src/features/arcade/ArcadeScreen.tsx',
  'src/features/portefeuille/PortefeuilleScreen.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/onNavigate\('paywall'\)/g, "navigate('/paywall')");
  content = content.replace(/onNavigate\('admin'\)/g, "navigate('/admin')");
  content = content.replace(/onNavigate\('srs'\)/g, "navigate('/srs')");
  content = content.replace(/onNavigate\('blocs'\)/g, "navigate('/blocs')");
  content = content.replace(/onNavigate\('quiz'\)/g, "navigate('/quiz')");
  content = content.replace(/onNavigate\('tuinterrogatif'\)/g, "navigate('/tuinterrogatif')");
  content = content.replace(/onNavigate\('contractions'\)/g, "navigate('/contractions')");
  content = content.replace(/onNavigate\('tutoiement'\)/g, "navigate('/tutoiement')");
  content = content.replace(/onNavigate\('dictionnaire'\)/g, "navigate('/dictionnaire')");
  content = content.replace(/onNavigate\('portefeuille'\)/g, "navigate('/portefeuille')");
  content = content.replace(/onNavigate\('leaderboard'\)/g, "navigate('/leaderboard')");
  content = content.replace(/onNavigate\('devplan'\)/g, "navigate('/devplan')");
  content = content.replace(/onNavigate\(`lesson_game_\\$\\{lecon\\.id\\}`\)/g, "navigate(`/lesson/${lecon.id}`)");
  content = content.replace(/onNavigate\(game\.id as any\)/g, "navigate(`/game/${game.id}`)");
  content = content.replace(/onNavigate\('apparence'\)/g, "navigate('/apparence')");
  fs.writeFileSync(f, content);
});
