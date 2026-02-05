import { useEffect, useState } from "react";
import axios from "axios";

const COLORS = [
  "#ffadad",
  "#ffd6a5",
  "#fdffb6",
  "#caffbf",
  "#9bf6ff",
  "#a0c4ff",
  "#bdb2ff",
  "#ffc6ff",
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function App() {
  const [notes, setNotes] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  // 🔹 Fetch Notes + assign stable colors
  function fetchNotes() {
    axios.get("https://notes-app-g0i6.onrender.com/api/notes").then((res) => {
      const fetchedNotes = res.data.notes;

      setColorMap((prev) => {
        const updated = { ...prev };

        fetchedNotes.forEach((note) => {
          if (!updated[note._id]) {
            updated[note._id] = getRandomColor();
          }
        });

        return updated;
      });

      setNotes(fetchedNotes);
    });
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  // 🔹 Add note
  function handleForm(e) {
    e.preventDefault();
    const { title, description } = e.target.elements;

    axios
      .post("https://notes-app-g0i6.onrender.com/api/notes", {
        title: title.value,
        description: description.value,
      })
      .then(() => {
        e.target.reset();
        fetchNotes();
      });
  }

  // 🔹 Delete note
  function handleDelete(id) {
    axios.delete(`https://notes-app-g0i6.onrender.com/api/notes/${id}`).then(() => {
      setColorMap((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      fetchNotes();
    });
  }

  // 🔹 Start edit
  function startEdit(note) {
    setEditId(note._id);
    setEditText(note.description);
  }

  // 🔹 Save edit
  function saveEdit(id) {
    axios
      .patch(`https://notes-app-g0i6.onrender.com/api/notes/${id}`, {
        description: editText,
      })
      .then(() => {
        setEditId(null);
        fetchNotes();
      });
  }

  return (
    <div className="app">
      <h1 className="title">📝 Notes App</h1>

      <form className="note-form" onSubmit={handleForm}>
        <input name="title" placeholder="Title" required />
        <textarea name="description" placeholder="Description" required />
        <button>Add Note</button>
      </form>

      <div className="notes">
        {notes.map((note) => (
          <div
            key={note._id}
            className="note"
            style={{ background: colorMap[note._id] }}
          >
            <h3>{note.title}</h3>

            {editId === note._id ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <p>{note.description}</p>
            )}

            <div className="actions">
              {editId === note._id ? (
                <button onClick={() => saveEdit(note._id)}>Save</button>
              ) : (
                <button onClick={() => startEdit(note)}>Edit</button>
              )}

              <button
                className="danger"
                onClick={() => handleDelete(note._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
