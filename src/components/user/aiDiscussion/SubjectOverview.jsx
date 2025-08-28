export default function SubjectOverview({ totals }) {
  return (
    <div className="summary-box">
      <span className="summary-item j"><i className="icon"/>+{totals['정직'] || 0}건</span>
      <span className="summary-item p"><i className="icon"/>+{totals['열정'] || 0}건</span>
      <span className="summary-item c"><i className="icon"/>+{totals['창의'] || 0}건</span>
      <span className="summary-item r"><i className="icon"/>+{totals['존중'] || 0}건</span>
      <span className="summary-item lk"><i className="icon"/>+{totals.totalReactions || 0}건</span>
      <span className="summary-item ch"><i className="icon"/>+{totals.totalMessages || 0}건</span>
    </div>
  );
}