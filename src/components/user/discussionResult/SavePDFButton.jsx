export default function SavePDFButton() {
  const handleClick = () => {
    // PDF 저장 기능은 별도 구현 필요
    alert("PDF 저장 기능은 추후 구현됩니다.");
  };

    const showButton = false; // 나중에 사용할 수 있도록 코드 보존, 현재는 숨김

  if (!showButton) return null;


  return (
    <button className="save-pdf-button" onClick={handleClick}>
      PDF 저장
    </button>
  );
}