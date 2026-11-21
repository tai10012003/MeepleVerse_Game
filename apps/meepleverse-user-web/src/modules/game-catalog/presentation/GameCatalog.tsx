import { ExpandedRulesButton } from "@/modules/games/uno-expanded/presentation/rules/ExpandedRulesButton";
import { UnoRulesButton } from "@/modules/games/uno/presentation/rules/UnoRulesButton";
import Link from "next/link";
import { catalogGames, gameStatusLabel, isGamePlayable } from "../model/games";
import { GameArtwork } from "./GameArtwork";

export function GameCatalog() {
  return <div className="game-catalog-grid">{catalogGames.map(game => <article className={"catalog-game game-" + game.artwork} key={game.id} data-game-id={game.id}>
    <Link className="game-artwork-link" href={"/games/" + game.id} aria-label={"Khám phá " + game.name} tabIndex={-1}><GameArtwork variant={game.artwork} /></Link>
    <div className="catalog-game-content">
      <span className={"game-status status-" + game.status}><i />{gameStatusLabel(game)}</span>
      <div className="catalog-game-heading"><h3><Link href={"/games/" + game.id}>{game.name}</Link></h3>{game.id === "uno-basic" ? <UnoRulesButton /> : game.id === "uno-expanded" ? <ExpandedRulesButton /> : <span aria-hidden="true">↗</span>}</div>
      <p>{game.description}</p>
      <ul className="game-tags" aria-label={"Đặc điểm " + game.name}>{game.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      <Link className={"button " + (isGamePlayable(game) ? "primary" : "secondary")} href={"/games/" + game.id + (isGamePlayable(game) ? "#play" : "")}>{isGamePlayable(game) ? "Chơi ngay" : "Xem giới thiệu"}<span aria-hidden="true">↗</span></Link>
    </div>
  </article>)}</div>;
}
