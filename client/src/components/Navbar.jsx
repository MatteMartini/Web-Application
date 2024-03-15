import React, { useState } from "react";
import { Navbar, Container, Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import 'bootstrap-icons/font/bootstrap-icons.css';

function NavBar(props) {
  const navigate = useNavigate();

  const [newTitle, setNewTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const name = props.user && props.user.name;
  const isAdmin = props.user && props.user.administrator;

  const handleLogout = () => {
    props.setFront(true);
    navigate("/");
    props.logout();
  };

  const handleTitleChange = (event) => {
    setNewTitle(event.target.value);
  };

  const handleCancelEdit = () => {
    setNewTitle('');
    setIsEditingTitle(false);
  };

  const handleTitleSubmit = (event) => {
    event.preventDefault();

    if (newTitle === '') {
      setErrorMsg('Inserire un titolo con almeno un carattere');
    } else {
      setNewTitle('');
      setIsEditingTitle(false);
      const updatedTitle = {
        id: props.title.id,
        titleName: newTitle,
      };
      props.editTitle(updatedTitle);
    }
  };

  return (
    <Navbar bg="success" variant="dark">
      <Container fluid>
        <Navbar.Brand className="fs-2">{props.title.titleName}</Navbar.Brand>
        <i className="bi bi-cup-hot-fill custom-icon"></i>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          {name ? (
            <>
              {isAdmin ? (
                <>
                  {!isEditingTitle ? (
                    <Button className="mx-2" variant="secondary" onClick={() => setIsEditingTitle(true)}>
                      Change Title
                    </Button>
                  ) : (<>
                    {errorMsg ? <Alert variant='danger' onClose={() => setErrorMsg('')} dismissible>{errorMsg}</Alert> : false}
                    <Form onSubmit={handleTitleSubmit} inline={true.toString()}>
                      <Form.Control
                        type="text"
                        value={newTitle}
                        onChange={handleTitleChange}
                        placeholder="Enter new title"
                        className="mr-2"
                      />
                      <Button type="submit" variant="primary">
                        Save
                      </Button>
                      <Button className="mx-2" variant="secondary" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </Form>
                  </>
                  )}
                </>
              ) : null}
              <Navbar.Text className="fs-5">
                {name ? "Signed in as: " + name : null}
                {isAdmin && !isEditingTitle ? " (Administrator)" : null}
              </Navbar.Text>
              <Button className="mx-2" variant="warning" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button className="mx-2" variant="primary" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;

