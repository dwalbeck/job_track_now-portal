import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {useJob} from '../../context/JobContext';
import ExportMenu from '../../components/ExportMenu/ExportMenu';
import apiService from '../../services/api';
import './Contacts.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TARGET_ROW = 10; // The row position to scroll the found contact to

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeLetter, setActiveLetter] = useState(null);
    const {selectedJobId} = useJob();
    const navigate = useNavigate();
    const tableContainerRef = useRef(null);
    const tableBodyRef = useRef(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = contacts.filter(contact =>
                `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredContacts(filtered);
        } else {
            setFilteredContacts(contacts);
        }
    }, [searchTerm, contacts]);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllContacts();
            setContacts(response || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleContactClick = (contact) => {
        navigate(`/contact-details/${contact.contact_id}`);
    };

    const handleCreateContact = () => {
        navigate('/contact-form');
    };

    const handleGoBack = () => {
        if (selectedJobId) {
            navigate(`/job-details/${selectedJobId}`);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleLetterClick = (letter) => {
        setActiveLetter(letter);

        // Find the first contact starting with this letter (by first_name)
        const contactIndex = filteredContacts.findIndex(contact => {
            const firstChar = (contact.first_name || '').charAt(0).toUpperCase();
            return firstChar === letter;
        });

        if (contactIndex === -1 || !tableContainerRef.current || !tableBodyRef.current) {
            return;
        }

        // Get all table rows
        const rows = tableBodyRef.current.querySelectorAll('tr');
        if (rows.length === 0 || contactIndex >= rows.length) {
            return;
        }

        const targetRow = rows[contactIndex];
        const rowHeight = targetRow.offsetHeight;

        // Calculate the scroll position to put the found row at the 10th position
        // We want (TARGET_ROW - 1) rows above it
        const rowsAbove = TARGET_ROW - 1;
        const scrollPosition = targetRow.offsetTop - (rowsAbove * rowHeight);

        tableContainerRef.current.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
        });
    };

    const handleExport = async () => {
        try {
            const response = await apiService.exportContacts();
            const { contact_export_file } = response;

            // Trigger file download
            const fileUrl = `${apiService.baseURL}/v1/files/exports/${contact_export_file}`;
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = contact_export_file;
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error exporting contacts:', error);
            alert('Failed to export contacts');
        }
    };

    return (
        <div className="contacts-page">
            <div className="header-container">
                <div className="header-left">
                    {selectedJobId && (
                        <button onClick={handleGoBack} className="back-button">
                            ←
                        </button>
                    )}
                    <h1 className="page-title">Contacts</h1>
                </div>
                <div className="header-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button onClick={clearSearch} className="clear-search">
                                ✕
                            </button>
                        )}
                    </div>
                    <button onClick={handleCreateContact} className="action-button">
                        + Create Contact
                    </button>
                    <ExportMenu label="Export Contacts" onExport={handleExport} />
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading contacts...</div>
            ) : (
                <div className="contacts-table-wrapper">
                    <div className="alphabet-index">
                        {ALPHABET.map(letter => (
                            <div
                                key={letter}
                                className={`alphabet-cell ${activeLetter === letter ? 'active' : ''}`}
                                onClick={() => handleLetterClick(letter)}
                            >
                                {letter}
                            </div>
                        ))}
                    </div>
                    <div className="contacts-table-container" ref={tableContainerRef}>
                        <table className="contacts-table">
                            <thead>
                            <tr>
                                <th className="first-name">First Name</th>
                                <th>Last Name</th>
                                <th>Job Title</th>
                                <th>Email</th>
                                <th className="phone">Phone</th>
                                <th>Company</th>
                                <th className="linkedin">LinkedIn</th>
                            </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                            {filteredContacts.map(contact => (
                                <tr
                                    key={contact.contact_id}
                                    className="contact-row"
                                    onClick={() => handleContactClick(contact)}
                                >
                                    <td>{contact.first_name}</td>
                                    <td>{contact.last_name}</td>
                                    <td>{contact.job_title}</td>
                                    <td>{contact.email}</td>
                                    <td>{contact.phone}</td>
                                    <td>{contact.company}</td>
                                    <td>
                                        {contact.linkedin && (
                                            <a
                                                href={contact.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                linkedin
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {filteredContacts.length === 0 && !loading && (
                            <div className="no-contacts">
                                {searchTerm ? 'No contacts match your search.' : 'No contacts found.'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;