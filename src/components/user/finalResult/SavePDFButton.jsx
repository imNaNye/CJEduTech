export default function SavePDFButton() {
  const handleClick = () => {
    // PDF 저장 기능은 별도 구현 필요
    alert("PDF 저장 기능은 추후 구현됩니다.");
  };

  return (
    <button className="save-pdf-button" onClick={handleClick}>
      PDF 저장
    </button>
  );
}