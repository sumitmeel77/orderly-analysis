import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios'; 

function App() {
  const [totalVolume, setTotalVolume] = useState(null);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let total = 0;
        let currentPage = 1;
        let shouldFetch = true;
        const fetchedPages = new Set();

        // Fetch the first page to get total entries and entries per page
        const firstPageResponse = await axios.get(`https://api-evm.orderly.org/v1/public/campaign/ranking?campaign_id=8&broker_id=logx&sort_by=volume&size=500&page=${currentPage}`);
        const responseData = firstPageResponse.data;
        const totalEntries = responseData.data.meta.total;
        const entriesPerPage = 500; // Assuming 500 entries per page

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalEntries / entriesPerPage);

        while (shouldFetch && currentPage <= totalPages) {
          setCurrentPageNumber(currentPage); // Update current page number
          
          // Fetch the page only if it hasn't been fetched before
          if (!fetchedPages.has(currentPage)) {
            const pageResponse = await axios.get(`https://api-evm.orderly.org/v1/public/campaign/ranking?campaign_id=8&broker_id=logx&sort_by=volume&size=500&page=${currentPage}`);
            const pageData = pageResponse.data;
            const rows = pageData.data.rows;

            // Check each row for zero volume
            for (const row of rows) {
              if (row.volume === 0) {
                shouldFetch = false;
                break;
              }
              total += row.volume;
            }

            // Mark the page as fetched
            fetchedPages.add(currentPage);
          }

          // If zero volume encountered or last page reached, stop fetching more pages
          if (!shouldFetch || currentPage >= totalPages) {
            break;
          }

          // Wait for rate limit interval before making the next request
          await rateLimitCheck();
          currentPage++;
        }

        // Set the total volume state
        setTotalVolume(total);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // Function to wait for rate limit interval
    const rateLimitCheck = async () => {
      await new Promise((resolve) => setTimeout(resolve, 18000)); // Wait for 13 seconds (less than 5 requests per minute)
    };

    // Call the fetchData function
    fetchData();
  }, []);

  return (
    <div className="App">
       <h1>Total Volume: {totalVolume !== null ? totalVolume.toFixed(4) : `Current Page: ${currentPageNumber}`}</h1>
    </div>
  );
}

export default App;
