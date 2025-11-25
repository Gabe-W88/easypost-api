import React from 'react';

export default function ProtectYourself() {
  return (
    <div style={{
      width: '100%',
      maxWidth: '465px',
      margin: '0 auto',
      padding: '12px 4px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#ffffff',
    }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '2px' }}>
        {/* Question 1 */}
        <div style={{
          flex: '0 0 140px',
          backgroundColor: '#d4dff4',
          borderRadius: '10px',
          padding: '11px 10px',
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: '#2d3748',
            lineHeight: '1.3',
          }}>
            Do you have a US driver's license?
          </div>
        </div>

        {/* No Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: '0 0 auto', paddingTop: '11px' }}>
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#2d3748' }}>No</span>
          <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '400' }}>→</span>
        </div>

        {/* Answer 1 */}
        <div style={{
          flex: 1,
          minWidth: '190px',
          backgroundColor: '#e8ecf1',
          borderRadius: '10px',
          padding: '11px 10px',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: '#2d3748',
            lineHeight: '1.3',
          }}>
            Find the issuer(s) for your country <a href="https://internationaldrivingpermit.org/" target="_blank" rel="noopener noreferrer" style={{
              color: '#2563eb',
              textDecoration: 'underline',
              fontWeight: '400',
            }}>here</a>.
          </div>
        </div>
      </div>

      {/* Yes Arrow 1 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        marginBottom: '2px',
        paddingLeft: '3px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: '400', color: '#2d3748' }}>Yes</span>
        <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '400' }}>↓</span>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '2px' }}>
        {/* Question 2 */}
        <div style={{
          flex: '0 0 140px',
          backgroundColor: '#d4dff4',
          borderRadius: '10px',
          padding: '11px 10px',
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: '#2d3748',
            lineHeight: '1.3',
          }}>
            Is going to AAA hard for you?
          </div>
        </div>

        {/* No Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: '0 0 auto', paddingTop: '11px' }}>
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#2d3748' }}>No</span>
          <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '400' }}>→</span>
        </div>

        {/* Answer 2 */}
        <div style={{
          flex: 1,
          minWidth: '190px',
          backgroundColor: '#e8ecf1',
          borderRadius: '10px',
          padding: '11px 10px',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: '#2d3748',
            lineHeight: '1.3',
          }}>
            Go to AAA; get an IDP in an hour for ~$35.
          </div>
        </div>
      </div>

      {/* Yes Arrow 2 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        marginBottom: '2px',
        paddingLeft: '3px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: '400', color: '#2d3748' }}>Yes</span>
        <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '400' }}>↓</span>
      </div>

      {/* Row 3 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '0px' }}>
        {/* Question 3 */}
        <div style={{
          flex: '0 0 140px',
          backgroundColor: '#d4dff4',
          borderRadius: '10px',
          padding: '11px 10px',
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: '#2d3748',
            lineHeight: '1.3',
          }}>
            Do you need delivery within 2 weeks in the US or 3 weeks abroad?
          </div>
        </div>

        {/* No Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: '0 0 auto', paddingTop: '11px' }}>
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#2d3748' }}>No</span>
          <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '400' }}>→</span>
        </div>

        {/* Answer 3 */}
        <div style={{
          flex: 1,
          minWidth: '190px',
          backgroundColor: '#e8ecf1',
          borderRadius: '10px',
          padding: '11px 10px',
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: '#2d3748',
            lineHeight: '1.3',
          }}>
            Consider applying online with AATA or AAA. AATA is slower but lower cost than Fast IDP. AAA's web partner <a href="https://www.trustpilot.com/review/govworks.com" target="_blank" rel="noopener noreferrer" style={{
              color: '#2563eb',
              textDecoration: 'underline',
              fontWeight: '400',
            }}>govWorks</a> has poor reviews & is also slower.
          </div>
        </div>
      </div>

      {/* Yes Arrow 3 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        marginTop: '-8px',
        marginBottom: '0px',
        paddingLeft: '3px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: '400', color: '#2d3748' }}>Yes</span>
        <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '400' }}>↓</span>
      </div>

      {/* Final CTA Box */}
      <div style={{
        backgroundColor: '#02569E',
        borderRadius: '10px',
        padding: '16px 14px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <div style={{
          flexShrink: 0,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}>
          <img 
            src="https://i.imgur.com/ICuSJNz.png" 
            alt="Fast IDP Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '3px',
            lineHeight: '1.2',
          }}>
            Fast IDP
          </div>
          <div style={{
            fontSize: '12px',
            lineHeight: '1.3',
            color: 'white',
            fontWeight: '400',
          }}>
            We're reliable, reachable, & the fastest IDP option online. Our 5-star reviews don't lie!
          </div>
        </div>
      </div>
    </div>
  );
}
