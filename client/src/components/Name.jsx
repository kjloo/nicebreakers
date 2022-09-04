import PropTypes from 'prop-types';
import React from 'react';

const Name = ({ title }) => {
    return (
        <h1 className="game-title">{title}</h1>
    )
}

Name.defaultProps = {
    title: 'Untitled Movie Game',
}

Name.propTypes = {
    title: PropTypes.string.isRequired,
}

export default Name