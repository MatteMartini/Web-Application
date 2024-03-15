import ListGroup from 'react-bootstrap/ListGroup';
import { useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

function CMS(props) {

  const navigate = useNavigate();
  const pagine = props.pages;
  const oggi = dayjs();
  const [objToEdit, setObjToEdit] = useState(undefined);
  const front=props.front;
  

  return (
    <>
      <Container fluid>
        {props.initialLoading ? <Loading /> :
          <>
            <Row className="mt-4">
              {props.loggedIn ? (
                <Col>
                  <h1>Benvenuto {props.user.name}!</h1>
                  <Button variant='info' onClick={() => props.setFront(front ? false : true)}>
                    {front === true ? 'Vai nel back-office' : 'Vai nel front-office'}
                  </Button>
                </Col>
              ) : (
                <Col>
                  <h1>Accedi per creare una nuova pagina o modificarne una tua!</h1>
                </Col>
              )}
            </Row>

            <Row className="mt-4">
              {front === false ?
                pagine.sort((a, b) => { a.publishDate ? a.publishDate.diff(b.publishDate) : null }).map((page) => (
                  <Col key={page.id} md={4}>
                    <Pagina page={page} user={props.user} loggedIn={props.loggedIn} deletePage={() => props.deletePage(page.id)} editPage={() => { setObjToEdit(page); }} />
                  </Col>
                )) :
                pagine.filter((page) => (page.publishDate ? oggi.diff(page.publishDate) > 0 : false))
                  .sort((a, b) => a.publishDate.diff(b.publishDate))
                  .map((page) => (
                    <Col key={page.id} md={4}>
                      <Pagina
                        page={page} user={props.user} loggedIn={props.loggedIn} deletePage={() => props.deletePage(page.id)} editPage={() => { setObjToEdit(page); }} front={front}
                      />
                    </Col>
                  ))
              }
            </Row>
          </>
        }
      </Container>
      {front ? null :
        <Button variant='success' onClick={() => navigate('/add')} className="position-absolute bottom-0 end-0 mb-3 me-3">Add page</Button>
      }
    </>
  );
}

function Pagina(props) {

  const navigate = useNavigate();
  const pagina = props.page;

  return (
    <Card style={{ width: '18rem' }}>
      <Card.Body>
        <Card.Title > {pagina.title} </Card.Title>
        <Card.Text> Autore: {pagina.author} </Card.Text>
      </Card.Body>
      <ListGroup className="list-group-flush">
        <ListGroup.Item>Data di creazione: {pagina.creationDate.format("YYYY-MM-DD")}</ListGroup.Item>
        <ListGroup.Item>Data di pubblicazione: {pagina.publishDate ? pagina.publishDate.format("YYYY-MM-DD") : 'Draft'}</ListGroup.Item>
      </ListGroup>
      <Card.Body>
        < Link className="btn btn-primary" to={`/page/${pagina.id}`} >
          <Button variant="primary">Visita</Button>
        </Link>
        {props.loggedIn && !props.front ? (
          <>
            <Button variant='secondary' className='mx-2' disabled={pagina.authorId !== props.user.id && !props.user.administrator}
              onClick={() => { navigate(`/edit/${pagina.id}`) }}><i className='bi bi-pencil-square' /></Button>
            <Button variant="danger" onClick={props.deletePage} disabled={pagina.authorId !== props.user.id && !props.user.administrator}>
              <i className='bi bi-trash' />
            </Button>
          </>
        ) : null}
      </Card.Body>
    </Card>
  );
}

function Loading(props) {
  return (
    <Spinner className='m-2' animation="border" role="status" />
  )
}

export default CMS;
