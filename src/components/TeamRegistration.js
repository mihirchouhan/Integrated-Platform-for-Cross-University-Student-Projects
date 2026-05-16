import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const TeamRegistration = () => {
  const [teamName, setTeamName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState([]);

  const addMember = () => {
    setMembers([...members, memberName]);
    setMemberName('');
  };

  const submitForm = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/teams`, {
        name: teamName,
        members,
      });
      alert('Team registered successfully!');
    } catch (error) {
      console.error('Error registering team:', error);
      alert('Error registering team. Please try again.');
    }
  };

  return (
    <div>
      <h2>Team Registration</h2>
      <label>Team Name:</label>
      <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
      <br />
      <label>Members:</label>
      <ul>
        {members.map((member, index) => (
          <li key={index}>{member}</li>
        ))}
      </ul>
      <input type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
      <button onClick={addMember}>Add Member</button>
      <br />
      <button onClick={submitForm}>Submit</button>
    </div>
  );
};

export default TeamRegistration;
