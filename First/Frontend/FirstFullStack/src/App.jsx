import { useState } from 'react'
import axios from "axios"
import { useEffect } from 'react'

function App() {

  const [ notes, setNotes ] = useState([])


  function fetchNotes(){
    axios.get('http://localhost:3000/api/notes')
    .then((res)=>{
       setNotes(res.data.notes)
    })
  }


  useEffect(()=>{
    fetchNotes()
  },[])


  function handleForm(e){
    e.preventDefault()

    const {title,description}= e.target.elements;

    console.log(title.value,description.value);

    axios.post("http://localhost:3000/api/notes",{
      title:title.value,
      description:description.value,
    
    })
    .then(()=>{
      fetchNotes()
    })
  }

  function handleDelete(noteId){

    axios.delete("http://localhost:3000/api/notes/"+noteId)
    .then(()=>{
      fetchNotes()
    })

  }


  function handleUpdate(noteId){

    axios.patch("http://localhost:300/api/notes/"+noteId)
    .then(()=>{
      fetchNotes()
    })

  }


  return (
    <div>
      <form onSubmit={handleForm}>

        <input type="text" name="title" placeholder='Title' />
        <br />
        <textarea name="description" placeholder='Description'></textarea>
        <br />
        <button type="submit">Add Note</button>

      </form>

      <hr />
      <div className="notes">
        {
          notes.map((note,idx) => {
           return <div key={idx} className="note">
              <h1>{note.title}</h1>
              <p>{note.description}</p>
              <button onClick={()=>{handleDelete(note._id)}}>Delete</button>

              <button onClick={()=>{handleUpdate(note._id)}}>Edit</button>
            </div>
          })
        }

      </div>
    </div>
  )
}

export default App