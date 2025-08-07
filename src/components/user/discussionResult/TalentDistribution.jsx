export default function TalentDistribution() {
  return (
    <div className="talent-distribution">
      <h3>전체 인재상 분포</h3>
      <img src="/images/talent_donut_chart.png" alt="인재상 도넛차트" className="distribution-chart" />
      <ul>
        <li>정직: 80%</li> {/*더미데이터*/}
        <li>열정: 40%</li>
        <li>창의: 40%</li>
        <li>존중: 40%</li>
      </ul>
    </div>
  );
}