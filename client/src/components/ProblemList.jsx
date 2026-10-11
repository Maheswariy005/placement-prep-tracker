import EmptyState from './EmptyState.jsx';

export default function ProblemList({
  problems,
  onStatusChange,
  onDelete,
}) {
  if (!problems.length) {
    return (
      <EmptyState
        title="No problems yet"
        message="Add a DSA problem to start tracking."
      />
    );
  }

  return (
    <div className="table-wrap card">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Topic</th>
            <th>Difficulty</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {problems.map((problem) => (
            <tr key={problem._id}>
              <td>
                <strong>{problem.title}</strong>
                <div className="muted">{problem.platform}</div>
              </td>

              <td>{problem.topic}</td>

              <td>
                <span className={`pill pill-${problem.difficulty}`}>
                  {problem.difficulty}
                </span>
              </td>

              <td>
                <select
                  value={problem.status}
                  onChange={(event) =>
                    onStatusChange(problem._id, event.target.value)
                  }
                >
                  <option value="todo">Todo</option>
                  <option value="solved">Solved</option>
                  <option value="revisit">Revisit</option>
                </select>
              </td>

              <td>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onDelete(problem._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}