import React from 'react';
import { Container, Row, Col, Button, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const path = "http://localhost:3001";

function PageVisualized(props) {

  const { pageId } = useParams();
  const pagine = props.pages;
  const navigate = useNavigate();
  const pagina = pagine.find(pag => pag.id === parseInt(pageId));

  return (
    <Container fluid>
      <Row >
        <Col>
          {pagina.blocks_array.sort((a, b) => a.orderIndex - b.orderIndex).map((blocco) => {
            if (blocco.type === "header") {
              return <h1 key={blocco.id}> {blocco.content} </h1>;
            }
            else if (blocco.type === "paragraph") {
              return <p key={blocco.id}> {blocco.content} </p>;
            }
            else if (blocco.type === "image") {
              return <React.Fragment key={blocco.id}>
                <Image src={path + blocco.imagePath} width={400} height={300} alt="Immagine" />
                <br /> {/* Aggiungi l'interruzione di linea dopo ogni immagine */}
              </React.Fragment>
            }
          })}
        </Col>
      </Row>
      <Button className='my-2 mx-2' variant='danger' onClick={() => navigate('/')}>Indietro</Button>
    </Container>
  );
}

export default PageVisualized