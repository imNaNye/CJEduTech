export default function AvatarButton({src, avartarID, onClick, className}){
    return(
        <button 
            type="button"
            onClick={onClick}
            className={className}
            style={{backgroundImage: `url(${src})`}}>
        </button>
    )
}