import React from 'react';
import PropTypes from 'prop-types';

const PaginationComponent = ({ totalPages, currentPage, onPageChange }) => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  const safeCurrentPage = isNaN(currentPage) ? 1 : currentPage;

  return (
    <div className="custom-pagination">
      {pages.map((page) => {
        const isActive = page === safeCurrentPage;
        console.log('Page:', page, 'Current:', currentPage, 'Is Active:', isActive);
        
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`pagination-button ${isActive ? 'active' : ''}`}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
};

PaginationComponent.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default PaginationComponent;
