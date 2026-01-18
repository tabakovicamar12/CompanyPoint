import axios from 'axios';

export const trackStat = async (endpointName, token) => {
    try {
        await axios.post('https://companypoint.onrender.com/stats', {
            klicanaStoritev: endpointName
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Statistics Error:', error.message);
    }
};