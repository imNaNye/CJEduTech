import PageHeader from "../../components/common/PageHeader";
import GameMain from "../../components/user/game/GameMain";
import '../../components/user/game/game.css'

export default function GamePage(){
    return(
        <div className="CJ 인성적 요소 구분 게임">
            <PageHeader title="Game"/>
            <GameMain/>
        </div>
    )
}