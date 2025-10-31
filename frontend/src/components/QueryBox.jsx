import {useState} from 'react';
import '../styles/query-box.css'

export function QueryBox({ onSend }){
    const [query,setQuery]=useState("");
    function handleQuery(){
        const text=(query||'').trim();
        if(!text) return;
        if(onSend) onSend(text);
        setQuery('');
    }
    function onKeyDown(e){
        if(e.key==='Enter'){handleQuery();}
    }
    return(
        <div>
           <div className="query-box-container"> <input placeholder='Type your query here...' className="query-box-input" type="text" value={query} onChange={(e)=>{setQuery(e.target.value)}} onKeyDown={onKeyDown} aria-label="Message Input"/>
        <button className='query-box-button' onClick={handleQuery}>Send!</button>
        </div>
        </div>
    )
}

